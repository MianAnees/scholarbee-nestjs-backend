import { ConflictException, HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { IsDateString, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { Model, Types } from 'mongoose';
import { QueryAnalyticsCommonDto } from 'src/analytics/dto/query-analytics.dto';
import { University, UniversityDocument } from 'src/universities/schemas/university.schema';
import { ElasticsearchService } from '../../elasticsearch/elasticsearch.service';
import { ApplicationMetricRegisterEventDto } from 'src/applications/dto/application-analytics.dto';
import { ApplicationProgressStep } from 'src/analytics/schema/application-metrics.schema';
import { ES_INDICES } from 'src/elasticsearch/types/es-indices.enum';
import { Search } from '@elastic/elasticsearch/api/requestParams';
import { getTimeRangeFilter } from 'src/elasticsearch/utils/time-range-filter.util';
import { IApplicationMetricRegisterEventIndexDoc } from 'src/elasticsearch/mappings/application-metrics.mapping';
import { UserNS } from 'src/users/schemas/user.schema';

@Injectable()
export class ApplicationMetricsAnalyticsService {
  private readonly logger = new Logger(ApplicationMetricsAnalyticsService.name);
  private readonly APPLICATION_METRICS_INDEX = ES_INDICES.APPLICATION_METRICS;

  private readonly applicationProgressStepAggNames = {
    [ApplicationProgressStep.APPLICATION_START]: 'application_started',
    [ApplicationProgressStep.APPLICATION_COMPLETE]: 'application_completed',
    [ApplicationProgressStep.PROFILE_SELF]: 'profile_self',
    [ApplicationProgressStep.PROFILE_CONTACT]: 'profile_contact',
    [ApplicationProgressStep.PROFILE_EDUCATION]: 'profile_education',
    [ApplicationProgressStep.PROFILE_DOCS]: 'profile_docs',
    [ApplicationProgressStep.APPLICATION_PROGRAM_SELECTION]:
      'application_program_selection',
  };

  constructor(
    private readonly elasticsearchService: ElasticsearchService,
    @InjectModel(University.name)
    private universityModel: Model<UniversityDocument>,
  ) { }


  /**
   * Index an application metric event to Elasticsearch
   */
  async indexApplicationMetricEvent(applicationMetric: IApplicationMetricRegisterEventIndexDoc) {
    this.logger.log(`🔍 Indexing document`, applicationMetric);
    try {

      return await this.elasticsearchService.indexDocument(
        this.APPLICATION_METRICS_INDEX,
        undefined, // Let Elasticsearch generate the ID
        applicationMetric,
      );
    } catch (error) {
      this.logger.error(
        `Error logging application metric event: ${error.message}`,
        error.stack,
      );
      return null;
    }
  }




  /**
   * Get most popular universities receiving applications
   * This gets total events (regardless of what step) for each university
   * TODO: Could be expanded to include 'unique users', etc
   */
  async getMostPopularUniversities(queryDto: QueryAnalyticsCommonDto) {
    try {
      const must: any[] = [];
      const must_not: any[] = [
        { term: { 'data.universityId': '' } },
        {
          bool: {
            must_not: { exists: { field: 'data.universityId' } },
          },
        },
      ];

      const timeRangeFilter = getTimeRangeFilter(queryDto.time_range);
      if (timeRangeFilter) {
        must.push(timeRangeFilter);
      }

      const query: any = {
        bool: {
          must,
          must_not,
        },
      };
      const aggKey = 'top_universities';
      const esQuery: Search<Record<string, any>>['body'] = {
          query:
            Object.keys(must).length || Object.keys(must_not).length
              ? query
              : undefined,
          aggs: {
            [aggKey]: {
              terms: {
                field: 'data.universityId',
                size: queryDto.limit,
              },
            },
          },
          size: 0,
      }

      const response = await this.elasticsearchService.search(
        this.APPLICATION_METRICS_INDEX,
        esQuery, // the default sort is by doc_count, descending
      ) as {
        aggregations: {
          [aggKey]: {
            buckets: { key: string; doc_count: number }[];
          };
        };
      };

      if (
        !Array.isArray(response?.aggregations?.[aggKey]?.buckets) ||
        response?.aggregations?.[aggKey]?.buckets?.length === 0
      ) {
        throw new HttpException(
          'No aggregation data (top_universities) found in Elasticsearch response.',
          HttpStatus.NOT_FOUND,
        );
      }

      const aggregationResponseBuckets =
        response.aggregations.top_universities.buckets.filter(
          (bucket) =>
            typeof bucket.key === 'string' &&
            Types.ObjectId.isValid(bucket.key),
        );

      const universityObjectIds = aggregationResponseBuckets.map(
        (bucket) => new Types.ObjectId(bucket.key),
      );

      const universityDetailList = await this.universityModel
        .find({ _id: { $in: universityObjectIds } })
        .select('name _id')
        .lean();

      if (universityObjectIds.length !== universityDetailList.length) {
        this.logger.warn('Some university IDs could not be resolved to names.');
      }

      const result = aggregationResponseBuckets.map((bucket) => {
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
  async getOverallMetrics(queryDto: QueryAnalyticsCommonDto) {
    // Map enum values to aggregation names
    const stepAggNames = this.applicationProgressStepAggNames;

    const must: any[] = [];
    const must_not: any[] = [];

    // Add time range filter if provided
    const timeRangeFilter = getTimeRangeFilter(queryDto?.time_range);
    if (timeRangeFilter) {
      must.push(timeRangeFilter);
    }

    const query: any = {
      bool: {
        must,
        must_not,
      },
    };

    const esQuery: Search<Record<string, any>>['body'] = {
      query: Object.keys(must).length || Object.keys(must_not).length ? query : undefined,
      aggs: Object.entries(stepAggNames).reduce(
        (acc, [step, aggName]) => {
          acc[aggName] = { filter: { term: { 'data.step': step } } };
          return acc;
        },
        {} as Record<string, any>,
      ),
      size: 0,
    };

    try {
      const response = await this.elasticsearchService.search(
        this.APPLICATION_METRICS_INDEX,
        esQuery,
      ) as {
        aggregations: {
          [key: string]: { doc_count: number };
        };
      };

      // Map the response to the aggregation names
      const result: {
        progress_events_counts: {
          [key: string]: number;
        };
        overall_progress_events_count: number;
      } = {
        progress_events_counts: {},
        overall_progress_events_count: 0,
      };
      Object.values(stepAggNames).forEach((aggName) => {
        result.progress_events_counts[aggName] = Number(
          response.aggregations[aggName]?.doc_count || 0,
        );
      });
      result.overall_progress_events_count = Object.values(result.progress_events_counts).reduce((sum, v) => sum + v, 0);
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
  async registerApplicationMetricEvent(
    userId: string,
    applicationMetric: ApplicationMetricRegisterEventDto,
  ) {
    this.logger.log(`📊 Indexing application metric`, applicationMetric);
    try {

      // // Check for duplicate by userId, programId, and step
      // const searchResult = await this.elasticsearchService.search(
      //   this.APPLICATION_METRICS_INDEX,
      //   {
      //     size: 1,
      //     query: {
      //       bool: {
      //         must: [
      //           { term: { 'user_id': userId } },
      //           { term: { 'data.admissionProgramId': applicationMetric.admissionProgramId } },
      //           { term: { 'data.step': applicationMetric.step } },
      //         ],
      //       },
      //     },
      //   },
      // ) as {
      //   hits: {
      //     hits: {
      //       _source: any;
      //     }[];
      //   };
      // }

      // if (
      //   Array.isArray(searchResult?.hits?.hits) &&
      //   searchResult.hits?.hits?.length > 0
      // ) {
      //   this.logger.warn(
      //     `Duplicate event detected for userId: ${userId}, programId: ${applicationMetric.programId}, step: ${applicationMetric.step}. Skipping indexing.`,
      //   );
      //   return null; // ? Not throwing exceptions as this should not interrupt the application flow
      //   // throw new ConflictException(
      //   //   `Duplicate event detected for userId: ${userId}, programId: ${applicationMetric.programId}, step: ${applicationMetric.step}. Skipping indexing.`,
      //   // );
      // }

      const applicationMetricDocument: IApplicationMetricRegisterEventIndexDoc = {
        user_id: userId,
        user_type: UserNS.UserType.Student,
        data: applicationMetric,
      }

      return await this.indexApplicationMetricEvent(applicationMetricDocument);

    } catch (error) {
      if (error instanceof HttpException) {
        this.logger.error(error.message);
        throw error;
      }

      this.logger.error(
        `Error indexing application metric: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Error indexing application metric: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get per-day breakdown of application metrics
   */
  async getDailyApplicationMetrics(queryDto: QueryAnalyticsCommonDto) {
    try {
      const must: any[] = [];
      const must_not: any[] = [];
      const timeRangeFilter = getTimeRangeFilter(queryDto?.time_range);
      if (timeRangeFilter) {
        must.push(timeRangeFilter);
      }
      const query: any = {
        bool: {
          must,
          must_not,
        },
      };
      const aggKey = 'per_day';
      // Build sub-aggregations for each step
      const stepAggNames = this.applicationProgressStepAggNames;
      const stepAggs = Object.entries(stepAggNames).reduce((acc, [step, aggName]) => {
        acc[aggName] = { filter: { term: { 'data.step': step } } };
        return acc;
      }, {} as Record<string, any>);

      const esQuery: Search<Record<string, any>>['body'] = {
        query: Object.keys(must).length || Object.keys(must_not).length ? query : undefined,
        aggs: {
          [aggKey]: {
            date_histogram: {
              field: 'timestamp',
              calendar_interval: 'day',
              order: { _key: 'desc' },
              format: 'yyyy-MM-dd',
              min_doc_count: 0,
            },
            aggs: stepAggs,
          },
        },
        size: 0,
      };
      const response = await this.elasticsearchService.search(
        this.APPLICATION_METRICS_INDEX,
        esQuery,
      ) as {
        aggregations: {
          [aggKey]: {
            buckets: Array<{
              key_as_string: string;
              doc_count: number;
              // Only stepAggs as dynamic keys
              [stepAgg: string]: any;
            }>;
          };
        };
      };
      let buckets = response?.aggregations?.[aggKey]?.buckets || [];
      // Apply limit (default 10)
      const limit = queryDto?.limit ?? 10;
      buckets = buckets.slice(0, limit);
      return buckets.map((bucket) => {
        const progress_events_counts: Record<string, number> = {};
        Object.values(stepAggNames).forEach((aggName) => {
          progress_events_counts[aggName] = bucket[aggName]?.doc_count || 0;
        });
        return {
          date: bucket.key_as_string,
          overall_progress_events_count: bucket.doc_count,
          progress_events_counts,
        };
      });
    } catch (error) {
      this.logger.error(
        `Error getting daily application metrics: ${error.message}`,
        error.stack,
      );
      return [];
    }
  }
} 