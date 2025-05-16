import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { EsMappingService } from 'es-mapping-ts';
import { ElasticsearchService } from '../elasticsearch.service';

@Injectable()
export class MappingRegistryService implements OnModuleInit {
  private readonly logger = new Logger(MappingRegistryService.name);
  private mappings: Map<string, any> = new Map();

  constructor(private readonly elasticsearchService: ElasticsearchService) {}

  async onModuleInit() {
    try {
      // 1. Get all mappings from decorated entities
      const mappings = EsMappingService.getInstance().getMappings();
      this.logger.log(`Mappings found: `);
      console.log(` mappings:`, mappings)

      // 2. Store and apply mappings
      for (const mapping of mappings) {
        this.mappings.set(mapping.index, mapping);
        await this.applyMapping(mapping.index); // Apply mapping at startup
        this.logger.log(`Registered mapping for index: ${mapping.index}`);
      }
    } catch (error) {
      this.logger.error(
        `Error registering Elasticsearch mappings: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Get mapping for a specific index
   */
  getMapping(index: string): any {
    const mapping = this.mappings.get(index);
    if (!mapping) {
      throw new Error(`No mapping found for index: ${index}`);
    }
    return mapping;
  }

  /**
   * Get all registered mappings
   */
  getAllMappings(): any[] {
    return Array.from(this.mappings.values());
  }

  /**
   * Apply mapping to an index
   */
  async applyMapping(index: string): Promise<boolean> {
    try {
      const mapping = this.getMapping(index);
      const exists = await this.elasticsearchService.indexExists(index);
      
      if (!exists) {
        const success = await this.elasticsearchService.createIndex(
          index,
          undefined,
          mapping.body.mappings
        );
        
        if (success) {
          this.logger.log(`Applied mapping to index: ${index}`);
          return true;
        }
      } else {
        this.logger.log(`Index ${index} already exists`);
        return true;
      }
    } catch (error) {
      this.logger.error(
        `Error applying mapping to index ${index}: ${error.message}`,
      );
      return false;
    }
  }
} 