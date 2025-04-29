import { Injectable, Logger } from '@nestjs/common';
import { ElasticsearchService as NestElasticsearchService } from '@nestjs/elasticsearch';
import { ConfigService } from '@nestjs/config';
import { IConfiguration } from 'src/config/configuration';

@Injectable()
export class ElasticsearchService {
  private readonly logger = new Logger(ElasticsearchService.name);

  constructor(
    private readonly elasticsearchService: NestElasticsearchService,
    private readonly configService: ConfigService<IConfiguration, true>,
  ) {}

  /**
   * Check if an index exists
   */
  async indexExists(index: string): Promise<boolean> {
    try {
      return await this.elasticsearchService.indices.exists({ index });
    } catch (error) {
      this.logger.error(`Error checking index existence: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * Create an index with mappings and settings
   */
  async createIndex(
    index: string,
    settings?: Record<string, any>,
    mappings?: Record<string, any>,
  ): Promise<boolean> {
    try {
      if (await this.indexExists(index)) {
        this.logger.log(`Index ${index} already exists`);
        return true;
      }

      await this.elasticsearchService.indices.create({
        index,
        body: {
          settings,
          mappings,
        },
      });
      this.logger.log(`Index ${index} created successfully`);
      return true;
    } catch (error) {
      this.logger.error(`Error creating index: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * Index a document
   */
  async indexDocument(
    index: string,
    id: string,
    document: Record<string, any>,
  ): Promise<boolean> {
    try {
      await this.elasticsearchService.index({
        index,
        id,
        document,
        refresh: true,
      });
      return true;
    } catch (error) {
      this.logger.error(`Error indexing document: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * Perform a bulk operation to index multiple documents
   */
  async bulk(operations: any[]): Promise<boolean> {
    try {
      await this.elasticsearchService.bulk({
        refresh: true,
        operations: operations.map(op => ({
          ...op,
          index: op.index,
        })),
      });
      return true;
    } catch (error) {
      this.logger.error(`Error performing bulk operation: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * Search documents
   */
  async search<T>(index: string, query: any): Promise<{
    hits: Array<{ _id: string; _source: T }>;
    total: number;
    aggregations?: any;
  }> {
    try {
      const response = await this.elasticsearchService.search<T>({
        index,
        ...query,
      });

      return {
        hits: response.hits.hits.map(hit => ({
          _id: hit._id,
          _source: hit._source,
        })),
        total: typeof response.hits.total === 'number' 
          ? response.hits.total 
          : response.hits.total.value,
        aggregations: response.aggregations,
      };
    } catch (error) {
      this.logger.error(`Error performing search: ${error.message}`, error.stack);
      throw error;
    }
  }

  
  /**
   * Delete a document
   */
  async deleteDocument(index: string, id: string): Promise<boolean> {
    try {
      await this.elasticsearchService.delete({
        index,
        id,
        refresh: true,
      });
      return true;
    } catch (error) {
      this.logger.error(`Error deleting document: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * Update a document
   */
  async updateDocument(
    index: string,
    id: string,
    doc: Record<string, any>,
  ): Promise<boolean> {
    try {
      await this.elasticsearchService.update({
        index,
        id,
        doc,
        refresh: true,
      });
      return true;
    } catch (error) {
      this.logger.error(`Error updating document: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * Get a document by ID
   */
  async getDocument<T>(index: string, id: string): Promise<T | null> {
    try {
      const response = await this.elasticsearchService.get<T>({
        index,
        id,
      });
      return response._source;
    } catch (error) {
      if (error.meta?.statusCode === 404) {
        return null;
      }
      this.logger.error(`Error getting document: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Delete an index
   */
  async deleteIndex(index: string): Promise<boolean> {
    try {
      await this.elasticsearchService.indices.delete({ index });
      return true;
    } catch (error) {
      this.logger.error(`Error deleting index: ${error.message}`, error.stack);
      return false;
    }
  }
} 