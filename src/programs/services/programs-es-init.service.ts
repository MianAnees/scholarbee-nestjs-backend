import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ElasticsearchService } from '../../elasticsearch/elasticsearch.service';
import { ES_INDICES, DEFAULT_INDEX_SETTINGS } from '../../analytics/config/elasticsearch-indices.config';
import { AnalyticFieldMappingConfig, AnalyzableFieldsConfig } from '../../elasticsearch/adapters/mapping-adapter.service';

/**
 * Program searchable fields definition
 * This is domain-specific and independent of any search implementation
 */
interface ProgramSearchableFields extends AnalyzableFieldsConfig {
  name: AnalyticFieldMappingConfig;
  major: AnalyticFieldMappingConfig;
  degree_level: AnalyticFieldMappingConfig;
  mode_of_study: AnalyticFieldMappingConfig;
  campus_id: AnalyticFieldMappingConfig;
  university_id: AnalyticFieldMappingConfig;
  academic_departments: AnalyticFieldMappingConfig;
  description: AnalyticFieldMappingConfig;
  created_at: AnalyticFieldMappingConfig;
  updated_at: AnalyticFieldMappingConfig;
}

/**
 * Program searchable fields configuration
 */
const PROGRAM_SEARCHABLE_FIELDS: ProgramSearchableFields = {
  name: {
    searchable: true,
    filterable: true,
    sortable: true,
  },
  major: {
    searchable: true,
    filterable: true,
    sortable: true,
  },
  degree_level: {
    searchable: false,
    filterable: true,
    sortable: true,
  },
  mode_of_study: {
    searchable: false,
    filterable: true,
    sortable: true,
  },
  campus_id: {
    searchable: false,
    filterable: true,
    sortable: false,
  },
  university_id: {
    searchable: false,
    filterable: true,
    sortable: false,
  },
  academic_departments: {
    searchable: false,
    filterable: true,
    sortable: false,
  },
  description: {
    searchable: true,
    filterable: false,
    sortable: false,
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
          PROGRAM_SEARCHABLE_FIELDS,
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