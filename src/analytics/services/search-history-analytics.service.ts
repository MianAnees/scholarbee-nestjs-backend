import { Injectable, Logger } from '@nestjs/common';
import { ElasticsearchService } from '../../elasticsearch/elasticsearch.service';
import { ISearchHistory } from '../schemas/search-history.entity';
import { QueryMostSearchedMajorsDto } from '../dto/query-most-searched-majors.dto';

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
      this.logger.error(`Error logging user event: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * Get most searched majors from search_history index
   */
  async getMostSearchedMajors(queryDto: QueryMostSearchedMajorsDto): Promise<Array<{ major: string; count: number }>> {
    try {
      const response = await this.elasticsearchService.search(this.SEARCH_HISTORY_INDEX, {
        aggs: {
          top_majors: {
            terms: {
              field: 'data.major.keyword',
              size: queryDto.limit
            }
          }
        },
        size: 0
      });

      console.log(JSON.stringify(response, null, 2));

      return response.aggregations.top_majors.buckets.map((bucket: any) => ({
        major: bucket.key,
        count: bucket.doc_count
      }));
    } catch (error) {
      this.logger.error(`Error getting most searched majors: ${error.message}`, error.stack);
      return [];
    }
  }

} 