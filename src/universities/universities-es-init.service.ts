import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ElasticsearchService } from '../elasticsearch/elasticsearch.service';
import { ES_INDICES, DEFAULT_INDEX_SETTINGS } from '../analytics/config/elasticsearch-indices.config';

/**
 * University index mapping
 */
const UNIVERSITY_MAPPING = {
  properties: {
    name: {
      type: 'text',
      analyzer: 'english',
      fields: {
        keyword: {
          type: 'keyword',
          ignore_above: 256
        },
        search: {
          type: 'text',
          analyzer: 'standard'
        }
      }
    },
    short_name: {
      type: 'text',
      analyzer: 'english',
      fields: {
        keyword: {
          type: 'keyword',
          ignore_above: 256
        }
      }
    },
    description: {
      type: 'text',
      analyzer: 'english'
    },
    location: {
      type: 'text',
      fields: {
        keyword: {
          type: 'keyword',
          ignore_above: 256
        }
      }
    },
    country: {
      type: 'keyword'
    },
    city: {
      type: 'keyword'
    },
    created_at: {
      type: 'date'
    },
    updated_at: {
      type: 'date'
    }
  }
};

@Injectable()
export class UniversitiesEsInitService implements OnModuleInit {
  private readonly logger = new Logger(UniversitiesEsInitService.name);

  constructor(private readonly elasticsearchService: ElasticsearchService) {}

  /**
   * Initialize Elasticsearch index when the module is initialized
   */
  async onModuleInit() {
    this.logger.log('Initializing University Elasticsearch index...');
    await this.initializeUniversityIndex();
  }

  /**
   * Initialize the university index
   */
  private async initializeUniversityIndex() {
    try {
      const exists = await this.elasticsearchService.indexExists(ES_INDICES.UNIVERSITIES);
      
      if (!exists) {
        const success = await this.elasticsearchService.createIndex(
          ES_INDICES.UNIVERSITIES,
          DEFAULT_INDEX_SETTINGS,
          UNIVERSITY_MAPPING,
        );
        
        if (success) {
          this.logger.log('University Elasticsearch index initialized successfully');
        } else {
          this.logger.warn('Failed to initialize University Elasticsearch index');
        }
      } else {
        this.logger.log('University Elasticsearch index already exists');
      }
    } catch (error) {
      this.logger.error(
        `Error initializing University Elasticsearch index: ${error.message}`,
        error.stack,
      );
    }
  }
} 