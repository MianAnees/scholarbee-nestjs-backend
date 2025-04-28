import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { IConfiguration } from 'src/config/configuration';

@Injectable()
export class ElasticsearchService {
  private readonly logger = new Logger(ElasticsearchService.name);
  private readonly baseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService<IConfiguration, true>,
  ) {
    this.baseUrl = this.configService.get('elasticsearch.serverUrl', { infer: true });
  }

  /**
   * Private method to handle HTTP requests and standardize error handling
   */
  private async makeRequest<T>(
    method: 'get' | 'post' | 'put' | 'delete' | 'head',
    path: string,
    data?: any,
    options: { headers?: Record<string, string>; params?: Record<string, any> } = {},
  ): Promise<T> {
    try {
      const url = `${this.baseUrl}${path}`;
      const response = await firstValueFrom(
        this.httpService.request({
          method,
          url,
          data,
          headers: options.headers,
          params: options.params,
        })
      );
      return response.data;
    } catch (error) {
      this.logger.error(`Elasticsearch request failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Private method to construct index path
   */
  private getIndexPath(index: string, action?: string, id?: string): string {
    let path = `/${index}`;
    if (action) path += `/${action}`;
    if (id) path += `/${id}`;
    return path;
  }

  /**
   * Check if an index exists
   */
  async indexExists(index: string): Promise<boolean> {
    try {
      await this.makeRequest('head', this.getIndexPath(index));
      return true;
    } catch (error) {
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

      await this.makeRequest('put', this.getIndexPath(index), {
        settings,
        mappings,
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
      await this.makeRequest(
        'put',
        this.getIndexPath(index, '_doc', id),
        document,
        { params: { refresh: true } }
      );
      return true;
    } catch (error) {
      this.logger.error(`Error indexing document: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * Perform a bulk operation
   */
  async bulk(operations: any[]): Promise<boolean> {
    try {
      await this.makeRequest(
        'post',
        '/_bulk',
        operations.join('\n') + '\n',
        {
          headers: { 'Content-Type': 'application/x-ndjson' },
          params: { refresh: true }
        }
      );
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
      const response = await this.makeRequest<any>(
        'post',
        this.getIndexPath(index, '_search'),
        query
      );

      return {
        hits: response.hits.hits.map(item => ({
          _id: item._id,
          _source: item._source as T,
        })),
        total: typeof response.hits.total === 'number'
          ? response.hits.total
          : response.hits.total?.value || 0,
        aggregations: response.aggregations,
      };
    } catch (error) {
      this.logger.error(`Error performing search: ${error.message}`, error.stack);
      return { hits: [], total: 0 };
    }
  }

  /**
   * Delete a document
   */
  async deleteDocument(index: string, id: string): Promise<boolean> {
    try {
      await this.makeRequest(
        'delete',
        this.getIndexPath(index, '_doc', id),
        undefined,
        { params: { refresh: true } }
      );
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
      await this.makeRequest(
        'post',
        this.getIndexPath(index, '_update', id),
        { doc },
        { params: { refresh: true } }
      );
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
      const response = await this.makeRequest<any>(
        'get',
        this.getIndexPath(index, '_doc', id)
      );
      return response._source as T;
    } catch (error) {
      this.logger.error(`Error getting document: ${error.message}`, error.stack);
      return null;
    }
  }

  /**
   * Delete an index
   */
  async deleteIndex(index: string): Promise<boolean> {
    try {
      await this.makeRequest('delete', this.getIndexPath(index));
      return true;
    } catch (error) {
      this.logger.error(`Error deleting index: ${error.message}`, error.stack);
      return false;
    }
  }
} 