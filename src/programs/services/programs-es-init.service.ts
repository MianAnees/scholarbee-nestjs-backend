import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { MappingRegistryService } from '../../elasticsearch/services/mapping-registry.service';

@Injectable()
export class ProgramsEsInitService implements OnModuleInit {
  private readonly logger = new Logger(ProgramsEsInitService.name);
  private readonly INDEX_NAME = 'programs';

  constructor(private readonly mappingRegistry: MappingRegistryService) {}

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
      const success = await this.mappingRegistry.applyMapping(this.INDEX_NAME);
      
      if (success) {
        this.logger.log('Program Elasticsearch index initialized successfully');
      } else {
        this.logger.warn('Failed to initialize Program Elasticsearch index');
      }
    } catch (error) {
      this.logger.error(
        `Error initializing Program Elasticsearch index: ${error.message}`,
        error.stack,
      );
    }
  }
} 