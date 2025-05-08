import { Injectable, Logger } from '@nestjs/common';
import { ElasticsearchService } from '../../elasticsearch/elasticsearch.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { University } from 'src/universities/schemas/university.schema';
import { UniversityDocument } from 'src/universities/schemas/university.schema';
import { QueryAnalyticsCommonDto } from 'src/analytics/dto/query-analytics.dto';

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
     */
    async getMostPopularUniversities(
        queryDto: QueryAnalyticsCommonDto,
    ): Promise<Array<{ university_id: string; university: string; count: number }>> {
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
                    count: bucket.doc_count,
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
} 