import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ElasticsearchService } from './elasticsearch.service';
import {
  DEFAULT_INDICES,
  DEFAULT_INDEX_SETTINGS,
  PROGRAM_MAPPING,
  UNIVERSITY_MAPPING,
  SEARCH_LOGS_MAPPING,
} from './elasticsearch.config';

@Injectable()
export class ElasticsearchInitService implements OnModuleInit {
  private readonly logger = new Logger(ElasticsearchInitService.name);

  constructor(private readonly elasticsearchService: ElasticsearchService) {}

  /**
   * Initialize Elasticsearch indices when the module is initialized
   */
  async onModuleInit() {
    this.logger.log('Initializing Elasticsearch indices...');
    await this.initializeIndices();
  }

  /**
   * Initialize all required indices
   */
  private async initializeIndices() {
    try {
      // Create program index
      const programsCreated = await this.elasticsearchService.createIndex(
        DEFAULT_INDICES.PROGRAMS,
        DEFAULT_INDEX_SETTINGS,
        PROGRAM_MAPPING,
      );

      // Create university index
      const universitiesCreated = await this.elasticsearchService.createIndex(
        DEFAULT_INDICES.UNIVERSITIES,
        DEFAULT_INDEX_SETTINGS,
        UNIVERSITY_MAPPING,
      );

      // Create search logs index
      const searchLogsCreated = await this.elasticsearchService.createIndex(
        DEFAULT_INDICES.SEARCH_LOGS,
        DEFAULT_INDEX_SETTINGS,
        SEARCH_LOGS_MAPPING,
      );

      if (programsCreated && universitiesCreated && searchLogsCreated) {
        this.logger.log('All Elasticsearch indices initialized successfully');
      } else {
        this.logger.warn('Some Elasticsearch indices failed to initialize');
      }
    } catch (error) {
      this.logger.error(
        `Error initializing Elasticsearch indices: ${error.message}`,
        error.stack,
      );
    }
  }
} 