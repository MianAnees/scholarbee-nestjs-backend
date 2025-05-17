import {
  Injectable,
  Logger,
  NotFoundException
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ES_INDICES } from 'src/elasticsearch/types/es-indices.enum';
import { getTimeRangeFilter } from 'src/elasticsearch/utils/time-range-filter.util';
import { University, UniversityDocument } from 'src/universities/schemas/university.schema';
import { ElasticsearchService } from '../../elasticsearch/elasticsearch.service';
import { ISearchHistoryIndexDoc } from '../../elasticsearch/mappings/search-history.mapping';
import { QueryAnalyticsCommonDto } from '../dto/query-analytics.dto';

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
  async indexSearchHistory(searchHistory: ISearchHistoryIndexDoc) {
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
      return null;
    }
  }

  /**
   * Get most searched majors from search_history index
   */
  async getMostSearchedMajors(
    queryDto: QueryAnalyticsCommonDto,
  ) {
    try {
      const must: any[] = [];
      const must_not: any[] = [
        { term: { 'data.major': '' } },
        {
          bool: {
            must_not: { exists: { field: 'data.major' } },
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

      // 1. Get the total count of docs with non-empty major
      const countResponse = await this.elasticsearchService.search(
        this.SEARCH_HISTORY_INDEX,
        {
          query: Object.keys(must).length || Object.keys(must_not).length ? query : undefined,
          size: 0,
          track_total_hits: true,
        }
      );

      const total_searches_with_major = Number(countResponse.hits?.total?.value) ?? 0;

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
                field: 'data.major',
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

      const majors = aggregationResponseBuckets.map((bucket) => ({
        major: bucket.key,
        count: bucket.doc_count,
      }));

      return {
        total_searches_with_major,
        majors,
      };
    } catch (error) {
      this.logger.error(
        `Error getting most searched majors: ${error.message}`,
        error.stack,
      );
      return { total_searches_with_major: 0, majors: [] };
    }
  }

  /**
   * Get most searched programs from search_history index
   * TODO: Find the place where this should be indexed. Most probably the `program_id` should be indexed when searching for admission programs or atleast the program name should be indexed when searching for programs
   */
  async getMostSearchedPrograms(
    queryDto: QueryAnalyticsCommonDto,
  ) {
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

      // 1. Get the total count of docs with non-empty program_name
      const countResponse = await this.elasticsearchService.search(
        this.SEARCH_HISTORY_INDEX,
        {
          query: Object.keys(must).length || Object.keys(must_not).length ? query : undefined,
          size: 0,
          track_total_hits: true,
        }
      );

      const total_searches_with_program_name = Number(countResponse.hits?.total?.value) ?? 0;

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

      const programs = aggregationResponseBuckets.map((bucket) => ({
        program: bucket.key,
        count: bucket.doc_count,
      }));

      return {
        total_searches_with_program_name,
        programs,
      };
    } catch (error) {
      this.logger.error(
        `Error getting most searched programs: ${error.message}`,
        error.stack,
      );
      return { total_searches_with_program_name: 0, programs: [] };
    }
  }

  /**
   * Get most searched universities from search_history index
   */
  async getMostSearchedUniversities(
    queryDto: QueryAnalyticsCommonDto,
  ) {
    try {
      const must: any[] = [];
      const must_not: any[] = [
        { term: { 'data.university_id': '' } }, // exclude docs with empty university_id
        {
          bool: {
            must_not: { exists: { field: 'data.university_id' } },
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

      // 1. Get the total count of docs with non-empty university_id
      const countResponse = await this.elasticsearchService.search(
        this.SEARCH_HISTORY_INDEX,
        {
          query: Object.keys(must).length || Object.keys(must_not).length ? query : undefined,
          size: 0,
          track_total_hits: true,
        }
      );

      const total_searches_with_uni_id = Number(countResponse.hits?.total?.value) ?? 0;

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
                field: 'data.university_id',
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

      let finalResponse: Array<{ university_id: string; university: string; count: number }> = [];

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

      return {
        total_searches_with_uni_id,
        universities: finalResponse,
      };
    } catch (error) {
      this.logger.error(
        `Error getting most searched universities: ${error.message}`,
        error.stack,
      );
      return null
    }
  }
}