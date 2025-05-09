import { ConflictException, HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { IsDateString, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { Model, Types } from 'mongoose';
import { QueryAnalyticsCommonDto } from 'src/analytics/dto/query-analytics.dto';
import { ApplicationProgressStep } from 'src/applications/schemas/application-metrics.schema';
import { University, UniversityDocument } from 'src/universities/schemas/university.schema';
import { ElasticsearchService } from '../../elasticsearch/elasticsearch.service';
import { ApplicationMetricDto } from 'src/applications/dto/application-analytics.dto';

@Injectable()
export class ApplicationMetricsAnalyticsService {
    private readonly logger = new Logger(ApplicationMetricsAnalyticsService.name);
    private readonly APPLICATION_METRICS_INDEX = 'application_metrics';

    constructor(
        private readonly elasticsearchService: ElasticsearchService,
        @InjectModel(University.name)
        private universityModel: Model<UniversityDocument>,
    ) { }

    /**
     * Get most popular universities receiving applications
     * TODO: Could be expanded to include 'unique users', etc
     */
    async getMostPopularUniversities(
        queryDto: QueryAnalyticsCommonDto,
    ) {
        try {
            const response = await this.elasticsearchService.search(
                this.APPLICATION_METRICS_INDEX,
                {
                    aggs: {
                        top_universities: {
                            terms: {
                                field: 'universityId',
                                size: queryDto.limit,
                            },
                        },
                    },
                    size: 0,
                },
            );

            const aggregationResponse = response.aggregations.top_universities as {
                buckets: { key: string; doc_count: number }[];
            };

            const universityObjectIds = aggregationResponse.buckets.map(
                (bucket) => new Types.ObjectId(bucket.key),
            );

            const universityDetailList = await this.universityModel
                .find({ _id: { $in: universityObjectIds } })
                .select('name _id')
                .lean();

            if (universityObjectIds.length !== universityDetailList.length) {
                this.logger.warn('Some university IDs could not be resolved to names.');
            }

            const result = aggregationResponse.buckets.map((bucket) => {
                const matchedUniversity = universityDetailList.find(
                    (university) => university._id.toString() === bucket.key,
                );
                return {
                    university_id: bucket.key,
                    university: matchedUniversity ? matchedUniversity.name : 'Unknown',
                    applications_count: bucket.doc_count,
                };
            });

            return result;
        } catch (error) {
            this.logger.error(
                `Error getting most popular universities: ${error.message}`,
                error.stack,
            );
            return [];
        }
    }

    /**
     * Get number of applications started vs completed
     * TODO: Could be expanded to include 'unique users', 'unique programs', 'overall completion rate over time' etc.
     */
    async getOverallMetrics() {
        // Map enum values to aggregation names
        const stepAggNames = {
            [ApplicationProgressStep.APPLICATION_START]: 'application_started',
            [ApplicationProgressStep.APPLICATION_COMPLETE]: 'application_completed',
            [ApplicationProgressStep.PROFILE_SELF]: 'profile_self',
            [ApplicationProgressStep.PROFILE_CONTACT]: 'profile_contact',
            [ApplicationProgressStep.PROFILE_EDUCATION]: 'profile_education',
            [ApplicationProgressStep.PROFILE_DOCS]: 'profile_docs',
            [ApplicationProgressStep.APPLICATION_PROGRAM_SELECTION]: 'application_program_selection',
        };

        const esQuery = {
            size: 0,
            aggs: Object.entries(stepAggNames).reduce((acc, [step, aggName]) => {
                acc[aggName] = { filter: { term: { step } } };
                return acc;
            }, {} as Record<string, any>),
        };

        try {
            const response = await this.elasticsearchService.search(
                this.APPLICATION_METRICS_INDEX,
                esQuery
            );
            // Map the response to the aggregation names
            const result: {
                progress_events_count: {
                    [key: string]: number
                }
            } = {
                progress_events_count: {}
            };
            Object.values(stepAggNames).forEach((aggName) => {
                result.progress_events_count[aggName] = Number(response.aggregations[aggName]?.doc_count || 0);
            });

            return result;
        } catch (error) {
            this.logger.error(
                `Error getting application started vs completed: ${error.message}`,
                error.stack,
            );
            return {};
        }
    }

    /**
     * Index an application metric event to Elasticsearch, avoiding duplicates by userId, programId, and step
     * 
     * REVIEW: Down the line, we might want to add sessionId (generated each time a user visits the application even if they have already started an application) to the index to for following reasons:
     * 1. To track the time taken to complete a step
     * 2. To track the drop-off points
     * 3. To track the behavioral patterns
     * 4. To track the user frustration or confusion
     */
    async registerApplicationMetricEvent(applicationMetric: ApplicationMetricDto) {
        this.logger.log(`📊 Indexing application metric`, applicationMetric);
        try {
            // Check for duplicate by userId, programId, and step
            const searchResult = await this.elasticsearchService.search(
                this.APPLICATION_METRICS_INDEX,
                {
                    size: 1,
                    query: {
                        bool: {
                            must: [
                                { term: { userId: applicationMetric.userId } },
                                { term: { programId: applicationMetric.programId } },
                                { term: { step: applicationMetric.step } }
                            ]
                        }
                    }
                }
            );

            if (searchResult.hits?.hits?.length > 0) {
                throw new ConflictException(`Duplicate event detected for userId: ${applicationMetric.userId}, programId: ${applicationMetric.programId}, step: ${applicationMetric.step}. Skipping indexing.`);
            }

            const document = {
                ...applicationMetric,
                timestamp: applicationMetric.timestamp || new Date(),
            };

            return await this.elasticsearchService.indexDocument(
                this.APPLICATION_METRICS_INDEX,
                undefined, // Let Elasticsearch generate the ID
                document,
            );

        } catch (error) {
            if (error instanceof HttpException) {
                this.logger.error(error.message,);
                throw error;
            } 

            this.logger.error(
                `Error indexing application metric: ${error.message}`,
                error.stack,
            );
            throw new HttpException(`Error indexing application metric: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
} 