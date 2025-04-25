import { Injectable, Logger } from '@nestjs/common';
import { ElasticsearchService as NestElasticsearchService } from '@nestjs/elasticsearch';
import { Client } from '@elastic/elasticsearch';

@Injectable()
export class ElasticsearchService {
  private readonly logger = new Logger(ElasticsearchService.name);

  constructor(private readonly elasticsearchService: NestElasticsearchService) {}

  /**
   * Get the Elasticsearch client
   */
  getClient() {
    return this.elasticsearchService;
  }

  /**
   * Check if an index exists
   * @param index The index name to check
   * @returns boolean indicating if the index exists
   */
  async indexExists(index: string): Promise<boolean> {
    try {
      const response = await this.elasticsearchService.indices.exists({ index });
      return response;
    } catch (error) {
      this.logger.error(`Error checking if index exists: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * Create an index with mappings and settings
   * @param index The index name
   * @param settings The index settings
   * @param mappings The index mappings
   * @returns boolean indicating success
   */
  async createIndex(
    index: string,
    settings?: Record<string, any>,
    mappings?: Record<string, any>,
  ): Promise<boolean> {
    try {
      const indexExists = await this.indexExists(index);
      if (indexExists) {
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
   * Index a document in Elasticsearch
   * @param index The index name
   * @param id The document ID
   * @param document The document to index
   * @returns boolean indicating success
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
        refresh: true, // Make the document immediately available for search
      });
      return true;
    } catch (error) {
      this.logger.error(`Error indexing document: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * Perform a bulk operation
   * @param operations Array of operations
   * @returns boolean indicating success
   */
  async bulk(operations: any[]): Promise<boolean> {
    try {
      await this.elasticsearchService.bulk({
        body: operations,
        refresh: true,
      });
      return true;
    } catch (error) {
      this.logger.error(`Error performing bulk operation: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * Perform a search query
   * @param searchParams Search parameters
   * @returns Search results
   */
  async search<T>(searchParams: any): Promise<{
    hits: Array<{ _id: string; _source: T }>;
    total: number;
    aggregations?: any;
  }> {
    try {
      const { hits, aggregations } = await this.elasticsearchService.search(searchParams);
      
      return {
        hits: hits.hits.map(item => ({
          _id: item._id,
          _source: item._source as T,
        })),
        total: typeof hits.total === 'number' 
          ? hits.total 
          : hits.total?.value || 0,
        aggregations,
      };
    } catch (error) {
      this.logger.error(`Error performing search: ${error.message}`, error.stack);
      return { hits: [], total: 0 };
    }
  }

  /**
   * Delete a document by ID
   * @param index The index name
   * @param id The document ID
   * @returns boolean indicating success
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
   * Update a document by ID
   * @param index The index name
   * @param id The document ID
   * @param doc The partial document to update
   * @returns boolean indicating success
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
        body: { doc },
        refresh: true,
      });
      return true;
    } catch (error) {
      this.logger.error(`Error updating document: ${error.message}`, error.stack);
      return false;
    }
  }
} 