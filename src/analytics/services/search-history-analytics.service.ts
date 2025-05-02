import { Injectable, Logger } from '@nestjs/common';
import { ElasticsearchService } from '../../elasticsearch/elasticsearch.service';
import { ISearchHistory } from '../schemas/search-history.entity';

@Injectable()
export class SearchHistoryAnalyticsService {
  private readonly logger = new Logger(SearchHistoryAnalyticsService.name);
  private readonly SEARCH_HISTORY_INDEX = 'search-history';

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

} 