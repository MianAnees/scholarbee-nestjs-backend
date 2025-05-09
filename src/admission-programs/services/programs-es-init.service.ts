// src/programs/services/programs-es-init.service.ts
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ElasticsearchService } from '../../elasticsearch/elasticsearch.service';
import { MappingRegistryService } from '../../elasticsearch/services/mapping-registry.service';
// import { ES_INDICES } from '../../analytics/config/elasticsearch-indices.config';

@Injectable()
export class ProgramsEsInitService implements OnModuleInit {
  private readonly logger = new Logger(ProgramsEsInitService.name);

  constructor(
    private readonly elasticsearchService: ElasticsearchService,
    private readonly mappingRegistryService: MappingRegistryService,
  ) {}

  async onModuleInit() {
    // this.logger.log('Initializing Programs Elasticsearch index...');
    // await this.initializeIndices();
  }

  private async initializeIndices() {
    try {
      // Apply mapping for programs index using MappingRegistryService
      // const programsSuccess = await this.mappingRegistryService.applyMapping(ES_INDICES.PROGRAMS); // NO NEED TO APPLY MAPPING FOR PROGRAMS INDEX
      // if (programsSuccess) {
      //   this.logger.log(
      //     'Programs Elasticsearch index initialized successfully',
      //   );
      // } else {
      //   this.logger.warn('Failed to initialize Programs Elasticsearch index');
      // }
    } catch (error) {
      this.logger.error(
        `Error initializing Programs Elasticsearch index: ${error.message}`,
        error.stack,
      );
    }
  }
}
