import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ElasticsearchService } from '../elasticsearch/elasticsearch.service';
import { ES_INDICES, DEFAULT_INDEX_SETTINGS } from '../analytics/config/elasticsearch-indices.config';
import { AnalyticFieldMappingConfig, AnalyzableFieldsConfig } from '../elasticsearch/adapters/mapping-adapter.service';

/**
 * University searchable fields definition
 * This is domain-specific and independent of any search implementation
 */
interface UniversitySearchableFields extends AnalyzableFieldsConfig {
  name: AnalyticFieldMappingConfig;
  short_name: AnalyticFieldMappingConfig;
  description: AnalyticFieldMappingConfig;
  location: AnalyticFieldMappingConfig;
  country: AnalyticFieldMappingConfig;
  city: AnalyticFieldMappingConfig;
  created_at: AnalyticFieldMappingConfig;
  updated_at: AnalyticFieldMappingConfig;
}

/**
 * University searchable fields configuration
 */
const UNIVERSITY_SEARCHABLE_FIELDS: UniversitySearchableFields = {
  name: {
    searchable: true,
    filterable: true,
    sortable: true,
  },
  short_name: {
    searchable: true,
    filterable: true,
    sortable: true,
  },
  description: {
    searchable: true,
    filterable: false,
    sortable: false,
  },
  location: {
    searchable: true,
    filterable: true,
    sortable: true,
  },
  country: {
    searchable: false,
    filterable: true,
    sortable: true,
  },
  city: {
    searchable: false,
    filterable: true,
    sortable: true,
  },
  created_at: {
    searchable: false,
    filterable: true,
    sortable: true,
  },
  updated_at: {
    searchable: false,
    filterable: true,
    sortable: true,
  },
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
          UNIVERSITY_SEARCHABLE_FIELDS,
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