import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ElasticsearchService } from '../../elasticsearch/elasticsearch.service';
import { ISearchHistory } from '../../elasticsearch/mappings/search-history.mapping';
import { QueryAnalyticsCommonDto } from '../dto/query-analytics.dto';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { University } from 'src/universities/schemas/university.schema';
import { UniversityDocument } from 'src/universities/schemas/university.schema';
import { ES_INDICES } from 'src/elasticsearch/types/es-indices.enum';
import { getTimeRangeFilter } from 'src/analytics/utils/time-range-filter.util';

@Injectable()
export class SearchHistoryAnalyticsService {
  private readonly logger = new Logger(SearchHistoryAnalyticsService.name);
  private readonly SEARCH_HISTORY_INDEX = ES_INDICES.SEARCH_HISTORY;

  constructor(
    private readonly elasticsearchService: ElasticsearchService,
    @InjectModel(University.name)
    private universityModel: Model<UniversityDocument>,
  ) {}

  /**
   * Log a user event to Elasticsearch
   */
  async indexDocument(searchHistory: ISearchHistory) {
    this.logger.log(`🔍 Indexing document`, searchHistory);
    try {
      return await this.elasticsearchService.indexDocument(
        this.SEARCH_HISTORY_INDEX,
        undefined, // Let Elasticsearch generate the ID
        searchHistory,
      );
    } catch (error) {
      this.logger.error(
        `Error logging user event: ${error.message}`,
        error.stack,
      );
      return false;
    }
  }

  /**
   * Get most searched majors from search_history index
   */
  async getMostSearchedMajors(
    queryDto: QueryAnalyticsCommonDto,
  ): Promise<Array<{ major: string; count: number }>> {
    try {
      const must: any[] = [];
      const must_not: any[] = [
        { term: { 'data.major.keyword': '' } },
        {
          bool: {
            must_not: { exists: { field: 'data.major.keyword' } },
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

      const aggKey = 'top_majors';
      const response = await this.elasticsearchService.search(
        this.SEARCH_HISTORY_INDEX,
        {
          query:
            Object.keys(must).length || Object.keys(must_not).length
              ? query
              : undefined,
          aggs: {
            [aggKey]: {
              terms: {
                field: 'data.major.keyword',
                size: queryDto.limit,
              },
            },
          },
          size: 0,
        },
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
        throw new NotFoundException(
          `No aggregation data (${aggKey}) found in Elasticsearch response.`,
        );
      }

      const aggregationResponseBuckets = response.aggregations[aggKey].buckets.filter(
        (bucket) => typeof bucket.key === 'string' && bucket.key.trim() !== ''
      );

      return aggregationResponseBuckets.map((bucket) => ({
        major: bucket.key,
        count: bucket.doc_count,
      }));
    } catch (error) {
      this.logger.error(
        `Error getting most searched majors: ${error.message}`,
        error.stack,
      );
      return [];
    }
  }

  /**
   * Get most searched programs from search_history index
   * TODO: Find the place where this should be indexed. Most probably the `program_id` should be indexed when searching for admission programs or atleast the program name should be indexed when searching for programs
   */
  async getMostSearchedPrograms(
    queryDto: QueryAnalyticsCommonDto,
  ): Promise<Array<{ program: string; count: number }>> {
    try {
      const must: any[] = [];
      const must_not: any[] = [
        { term: { 'data.program_name.keyword': '' } },
        {
          bool: {
            must_not: { exists: { field: 'data.program_name.keyword' } },
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

      const aggKey = 'top_programs';
      const response = await this.elasticsearchService.search(
        this.SEARCH_HISTORY_INDEX,
        {
          query:
            Object.keys(must).length || Object.keys(must_not).length
              ? query
              : undefined,
          aggs: {
            [aggKey]: {
              terms: {
                field: 'data.program_name.keyword',
                size: queryDto.limit,
              },
            },
          },
          size: 0,
        },
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
        throw new NotFoundException(
          `No aggregation data (${aggKey}) found in Elasticsearch response.`,
        );
      }

      const aggregationResponseBuckets = response.aggregations[aggKey].buckets.filter(
        (bucket) => typeof bucket.key === 'string' && bucket.key.trim() !== ''
      );

      return aggregationResponseBuckets.map((bucket) => ({
        program: bucket.key,
        count: bucket.doc_count,
      }));
    } catch (error) {
      this.logger.error(
        `Error getting most searched programs: ${error.message}`,
        error.stack,
      );
      return [];
    }
  }

  /**
   * Get most searched universities from search_history index
   */
  async getMostSearchedUniversities(
    queryDto: QueryAnalyticsCommonDto,
  ): Promise<Array<{ university: string; count: number }>> {
    try {
      const must: any[] = [];
      const must_not: any[] = [
        { term: { 'data.university_id.keyword': '' } },
        {
          bool: {
            must_not: { exists: { field: 'data.university_id.keyword' } },
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
      const response = await this.elasticsearchService.search(
        this.SEARCH_HISTORY_INDEX,
        {
          query:
            Object.keys(must).length || Object.keys(must_not).length
              ? query
              : undefined,
          aggs: {
            [aggKey]: {
              terms: {
                field: 'data.university_id.keyword',
                size: queryDto.limit,
              },
            },
          },
          size: 0,
        },
      ) as {
        aggregations: {
          [aggKey]: {
            buckets: { key: string; doc_count: number }[];
          };
        };
      };

      if (
        // if bucket is not an array, throw an error
        !Array.isArray(response?.aggregations?.[aggKey]?.buckets) ||
        // If the buckets are empty, throw an error
        response?.aggregations?.[aggKey]?.buckets?.length === 0
      ) {
        throw new NotFoundException(
          `No aggregation data (${aggKey}) found in Elasticsearch response.`,
        );
      }

      // ? This is to ensure that the university_id is a valid object id since these ids will be used to query the university details in the university collection
      const aggregationResponseBuckets =
        response?.aggregations?.[aggKey]?.buckets?.filter((bucket) => {
          // if bucket key is a non valid object id, return false
          if (!Types.ObjectId.isValid(bucket.key)) {
            return false;
          }
          return true;
        });

      const universityObjectIds: Types.ObjectId[] = [];
      for (const bucket of aggregationResponseBuckets) {
        try {
          universityObjectIds.push(new Types.ObjectId(bucket.key));
        } catch (error) {
          this.logger.error(
            `University id is not valid while getting most searched universities: ${error.message}`,
            error.stack,
          );
        }
      }

      // convert the university_id to university name using mongoose
      const universityDetailList = await this.universityModel
        .find({
          _id: { $in: universityObjectIds },
        })
        .select('name _id')
        .lean();

      // if count of universityIds is not equal to the count of universitiesInfo, throw an error
      if (universityObjectIds.length !== universityDetailList.length) {
        throw new Error(
          'Count of response is not equal to the count of universitiesInfo',
        );
      }

      let finalResponse = [];

      // get a list of aggregation response with the relevant university name and university_id
      for (const bucket of aggregationResponseBuckets) {
        try {
          const matchedUniversity = universityDetailList.find(
            (university) => university._id.toString() === bucket.key,
          );

          if (!matchedUniversity) {
            throw new Error('Invalid university_id');
          }

          // check if the bucket.key is one of the valid university_id
          if (!universityObjectIds.some((id) => id.toString() === bucket.key)) {
            throw new Error('Invalid university_id');
          }

          finalResponse.push({
            university_id: bucket.key,
            university: matchedUniversity.name,
            count: bucket.doc_count,
          });
        } catch (error) {
          this.logger.error(
            `University id is not valid while getting most searched universities: ${error.message}`,
            error.stack,
          );
        }
      }

      return finalResponse;
    } catch (error) {
      this.logger.error(
        `Error getting most searched universities: ${error.message}`,
        error.stack,
      );
      return [];
    }
  }
}