import { Injectable, Logger } from '@nestjs/common';
import { ElasticsearchService } from '../../elasticsearch/elasticsearch.service';
import { ISearchHistory } from '../schemas/search-history.entity';
import { QueryMostSearchedMajorsDto } from '../dto/query-most-searched-majors.dto';
import { QueryMostSearchedUniversitiesDto } from '../dto/query-most-searched-universities.dto';

@Injectable()
export class SearchHistoryAnalyticsService {
  private readonly logger = new Logger(SearchHistoryAnalyticsService.name);
  private readonly SEARCH_HISTORY_INDEX = 'search_history';

  constructor(private readonly elasticsearchService: ElasticsearchService) {}

  /**
   * Log a user event to Elasticsearch
   */
  async indexDocument(searchHistory: ISearchHistory): Promise<boolean> {
    try {
      const document = {
        ...searchHistory,
        timestamp: searchHistory.timestamp || new Date(),
      };

      return await this.elasticsearchService.indexDocument(
        this.SEARCH_HISTORY_INDEX,
        undefined, // Let Elasticsearch generate the ID
        document,
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
    queryDto: QueryMostSearchedMajorsDto,
  ): Promise<Array<{ major: string; count: number }>> {
    try {
      const response = await this.elasticsearchService.search(
        this.SEARCH_HISTORY_INDEX,
        {
          aggs: {
            top_majors: {
              terms: {
                field: 'data.major.keyword',
                size: queryDto.limit,
              },
            },
          },
          size: 0,
        },
      );

      const aggregationResponse = response.aggregations.top_majors as {
        buckets: { key: string; doc_count: number }[];
      };

      return aggregationResponse.buckets.map((bucket) => ({
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
    queryDto: QueryMostSearchedMajorsDto,
  ): Promise<Array<{ program: string; count: number }>> {
    try {
      const response = await this.elasticsearchService.search(
        this.SEARCH_HISTORY_INDEX,
        {
          aggs: {
            top_programs: {
              terms: {
                field: 'data.program_name.keyword',
                size: queryDto.limit,
              },
            },
          },
          size: 0,
        },
      );

      const aggregationResponse = response.aggregations.top_programs as {
        buckets: { key: string; doc_count: number }[];
      };

      return aggregationResponse.buckets.map((bucket) => ({
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
    queryDto: QueryMostSearchedUniversitiesDto,
  ): Promise<Array<{ university: string; count: number }>> {
    try {
      const response = await this.elasticsearchService.search(
        this.SEARCH_HISTORY_INDEX,
        {
          aggs: {
            // this `top_universities` will then be returned in the aggregations object of the response
            top_universities: {
              terms: {
                field: 'data.university_id.keyword',
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

      return aggregationResponse.buckets.map((bucket) => ({
        university: bucket.key,
        count: bucket.doc_count,
      }));
    } catch (error) {
      this.logger.error(
        `Error getting most searched universities: ${error.message}`,
        error.stack,
      );
      return [];
    }
  }
}
