import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { MappingRegistryService } from '../elasticsearch/services/mapping-registry.service';

@Injectable()
export class UniversitiesEsInitService implements OnModuleInit {
  private readonly logger = new Logger(UniversitiesEsInitService.name);
  private readonly INDEX_NAME = 'universities';

  constructor(private readonly mappingRegistry: MappingRegistryService) {}

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
      const success = await this.mappingRegistry.applyMapping(this.INDEX_NAME);
      
      if (success) {
        this.logger.log('University Elasticsearch index initialized successfully');
      } else {
        this.logger.warn('Failed to initialize University Elasticsearch index');
      }
    } catch (error) {
      this.logger.error(
        `Error initializing University Elasticsearch index: ${error.message}`,
        error.stack,
      );
    }
  }
} 