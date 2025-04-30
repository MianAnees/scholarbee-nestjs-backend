import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ElasticsearchService } from '../../elasticsearch/elasticsearch.service';
import { ES_INDICES, DEFAULT_INDEX_SETTINGS } from '../config/elasticsearch-indices.config';

/**
 * Default mapping for search logs index
 */
const SEARCH_LOGS_MAPPING = {
  properties: {
    query: {
      type: 'text',
      fields: {
        keyword: {
          type: 'keyword',
          ignore_above: 256
        }
      }
    },
    filters: {
      type: 'object',
      enabled: true
    },
    entity_type: {
      type: 'keyword'
    },
    timestamp: {
      type: 'date'
    },
    user_id: {
      type: 'keyword'
    },
    results_count: {
      type: 'integer'
    },
    selected_results: {
      type: 'keyword'
    },
    session_id: {
      type: 'keyword'
    },
    client_info: {
      type: 'object',
      enabled: true
    }
  }
};

/**
 * Default mapping for user events index
 */
const USER_EVENTS_MAPPING = {
  properties: {
    timestamp: {
      type: 'date'
    },
    studentId: {
      type: 'keyword'
    },
    eventType: {
      type: 'keyword'
    },
    eventData: {
      type: 'object',
      enabled: true,
      properties: {
        major: {
          type: 'text',
          fields: {
            keyword: {
              type: 'keyword',
              ignore_above: 256
            }
          }
        },
        degree_level: {
          type: 'keyword'
        },
        university_id: {
          type: 'keyword'
        },
        program_id: {
          type: 'keyword'
        },
        filters: {
          type: 'object',
          enabled: true
        },
        results_count: {
          type: 'integer'
        },
        selected_results: {
          type: 'keyword'
        },
        source: {
          type: 'keyword'
        },
        referral_code: {
          type: 'keyword'
        },
        marketing_channel: {
          type: 'keyword'
        }
      }
    }
  }
};

@Injectable()
export class AnalyticsEsInitService implements OnModuleInit {
  private readonly logger = new Logger(AnalyticsEsInitService.name);

  constructor(private readonly elasticsearchService: ElasticsearchService) {}

  /**
   * Initialize Elasticsearch indices when the module is initialized
   */
  async onModuleInit() {
    this.logger.log('Initializing Analytics Elasticsearch indices...');
    await this.initializeIndices();
  }

  /**
   * Initialize analytics-related indices (i.e. search logs and user events)
   */
  private async initializeIndices() {
    try {
      // Create search logs index
      const searchLogsExists = await this.elasticsearchService.indexExists(ES_INDICES.SEARCH_LOGS);
      let searchLogsCreated = true;
      
      if (!searchLogsExists) {
        searchLogsCreated = await this.elasticsearchService.createIndex(
          ES_INDICES.SEARCH_LOGS,
          DEFAULT_INDEX_SETTINGS,
          SEARCH_LOGS_MAPPING,
        );
      }

      // Create user events index
      const userEventsExists = await this.elasticsearchService.indexExists(ES_INDICES.USER_EVENTS);
      let userEventsCreated = true;
      
      if (!userEventsExists) {
        userEventsCreated = await this.elasticsearchService.createIndex(
          ES_INDICES.USER_EVENTS,
          DEFAULT_INDEX_SETTINGS,
          USER_EVENTS_MAPPING,
        );
      }

      if (searchLogsCreated && userEventsCreated) {
        this.logger.log('Analytics Elasticsearch indices initialized successfully');
      } else {
        this.logger.warn('Some Analytics Elasticsearch indices failed to initialize');
      }
    } catch (error) {
      this.logger.error(
        `Error initializing Analytics Elasticsearch indices: ${error.message}`,
        error.stack,
      );
    }
  }
} 