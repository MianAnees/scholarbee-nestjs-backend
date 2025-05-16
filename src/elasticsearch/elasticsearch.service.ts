import { HttpException, HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ElasticsearchService as NestElasticsearchService } from '@nestjs/elasticsearch';
import { IConfiguration } from 'src/config/configuration';
import { DEFAULT_INDEX_SETTINGS } from 'src/elasticsearch/config/es-indexing-settings.config';
import { applicationMetricsRawMappings } from 'src/elasticsearch/mappings/application-metrics.mapping';
import { ES_INDICES } from 'src/elasticsearch/mappings/es-indices.enum';
import { searchHistoryRawMappings } from 'src/elasticsearch/mappings/search-history.mapping';

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
      const response = await this.elasticsearchService.indices.exists({ index });
      return response.body
    } catch (error) {
      this.logger.error(`Error checking if index ${index} exists: ${error.message}`);
      return false;
    }
  }

  /**
   * Create an index with the given settings and mappings
   */
  async createIndex(
    index: string,
    settings?: Record<string, any>,
    mappings?: Record<string, any>,
  ): Promise<boolean> {
    try {
      await this.elasticsearchService.indices.create({
        index,
        body: {
          settings,
          mappings,
        },
      });
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
  ) {
    try {
      const documentWithTimestamp = {
        ...document,
        timestamp: new Date(),
      };

      await this.elasticsearchService.index({
        index,
        id,
        body: documentWithTimestamp,
      });

      return {
        success: true,
        message: 'Document indexed successfully',
        data: {
          index: index,
          id: id,
          document: documentWithTimestamp,
        }
      };
    } catch (error) {
      this.logger.error(`Error indexing document: ${error.message}`, {
        index,
        id,
        document,
      });

      throw new HttpException(`Error indexing document: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Search an index
   */
  async search(index: string, query: any): Promise<any> {
    try {
      const result = await this.elasticsearchService.search({
        index,
        body: query,
      });
      return result;
    } catch (error) {
      this.logger.error(`Error searching index: ${error.message}`, {
        index,
        query,
      });
      throw error;
    }
  }

  /**
   * Get a document by ID
   */
  async getDocument(index: string, id: string): Promise<any> {
    try {
      const result = await this.elasticsearchService.get({
        index,
        id,
      });
      return result;
    } catch (error) {
      this.logger.error(`Error getting document: ${error.message}`, error.stack);
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
        body: {
          doc,
        },
      });
      return true;
    } catch (error) {
      this.logger.error(`Error updating document: ${error.message}`, error.stack);
      return false;
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

  /**
   * Bulk index documents
   */
  async bulk(operations: any[]): Promise<boolean> {
    try {
      if (operations.length === 0) {
        return true;
      }

      const response = await this.elasticsearchService.bulk({
        refresh: true,
        body: operations,
      });

      if (typeof response === 'object' && 'body' in response) {
        return !(response.body?.errors || false);
      }

      return !(response as any).errors;
    } catch (error) {
      this.logger.error(`Error performing bulk operation: ${error.message}`);
      return false;
    }
  }
} 