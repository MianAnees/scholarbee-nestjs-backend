import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ElasticsearchService } from '../../elasticsearch/elasticsearch.service';
import { ES_INDICES, DEFAULT_INDEX_SETTINGS } from '../../analytics/config/elasticsearch-indices.config';

/**
 * Program index mapping
 */
const PROGRAM_MAPPING = {
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
    major: {
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
    degree_level: {
      type: 'keyword'
    },
    mode_of_study: {
      type: 'keyword'
    },
    campus_id: {
      type: 'keyword'
    },
    university_id: {
      type: 'keyword'
    },
    academic_departments: {
      type: 'keyword'
    },
    description: {
      type: 'text',
      analyzer: 'english'
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
export class ProgramsEsInitService implements OnModuleInit {
  private readonly logger = new Logger(ProgramsEsInitService.name);

  constructor(private readonly elasticsearchService: ElasticsearchService) {}

  /**
   * Initialize Elasticsearch index when the module is initialized
   */
  async onModuleInit() {
    this.logger.log('Initializing Program Elasticsearch index...');
    await this.initializeProgramIndex();
  }

  /**
   * Initialize the program index
   */
  private async initializeProgramIndex() {
    try {
      const exists = await this.elasticsearchService.indexExists(ES_INDICES.PROGRAMS);
      
      if (!exists) {
        const success = await this.elasticsearchService.createIndex(
          ES_INDICES.PROGRAMS,
          DEFAULT_INDEX_SETTINGS,
          PROGRAM_MAPPING,
        );
        
        if (success) {
          this.logger.log('Program Elasticsearch index initialized successfully');
        } else {
          this.logger.warn('Failed to initialize Program Elasticsearch index');
        }
      } else {
        this.logger.log('Program Elasticsearch index already exists');
      }
    } catch (error) {
      this.logger.error(
        `Error initializing Program Elasticsearch index: ${error.message}`,
        error.stack,
      );
    }
  }
} 