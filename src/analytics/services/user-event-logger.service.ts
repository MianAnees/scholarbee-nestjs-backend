import { Injectable, Logger } from '@nestjs/common';
import { ElasticsearchService } from '../../elasticsearch/elasticsearch.service';
import { UserEvent } from '../schemas/analytics-event.entity';

@Injectable()
export class UserEventLoggerService {
  private readonly logger = new Logger(UserEventLoggerService.name);
  private readonly USER_EVENTS_INDEX = 'user-events';

  constructor(private readonly elasticsearchService: ElasticsearchService) {}

  /**
   * Log a user event to Elasticsearch
   */
  async logEvent(event: UserEvent) {
    try {
      const document = {
        ...event,
        timestamp: event.timestamp || new Date(),
      };

      return await this.elasticsearchService.indexDocument(
        this.USER_EVENTS_INDEX,
        undefined, // Let Elasticsearch generate the ID
        document,
      );
    } catch (error) {
      this.logger.error(`Error logging user event: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * Get most searched majors
   */
  async getMostSearchedMajors(limit: number = 10): Promise<Array<{ major: string; count: number }>> {
    try {
      const response = await this.elasticsearchService.search(this.USER_EVENTS_INDEX, {
        query: {
          term: { eventType: 'search' }
        },
        aggs: {
          top_majors: {
            terms: {
              field: 'eventData.major.keyword',
              size: limit
            }
          }
        },
        size: 0
      });

      return response.aggregations.top_majors.buckets.map(bucket => ({
        major: bucket.key,
        count: bucket.doc_count
      }));
    } catch (error) {
      this.logger.error(`Error getting most searched majors: ${error.message}`, error.stack);
      return [];
    }
  }

  /**
   * Get most searched degree levels
   */
  async getMostSearchedDegreeLevels(limit: number = 10): Promise<Array<{ degree_level: string; count: number }>> {
    try {
      const response = await this.elasticsearchService.search(this.USER_EVENTS_INDEX, {
        query: {
          term: { eventType: 'search' }
        },
        aggs: {
          top_degree_levels: {
            terms: {
              field: 'eventData.degree_level.keyword',
              size: limit
            }
          }
        },
        size: 0
      });

      return response.aggregations.top_degree_levels.buckets.map(bucket => ({
        degree_level: bucket.key,
        count: bucket.doc_count
      }));
    } catch (error) {
      this.logger.error(`Error getting most searched degree levels: ${error.message}`, error.stack);
      return [];
    }
  }

  /**
   * Get most popular universities by search
   */
  async getMostSearchedUniversities(limit: number = 10): Promise<Array<{ university_id: string; count: number }>> {
    try {
      const response = await this.elasticsearchService.search(this.USER_EVENTS_INDEX, {
        query: {
          term: { eventType: 'search' }
        },
        aggs: {
          top_universities: {
            terms: {
              field: 'eventData.university_id.keyword',
              size: limit
            }
          }
        },
        size: 0
      });

      return response.aggregations.top_universities.buckets.map(bucket => ({
        university_id: bucket.key,
        count: bucket.doc_count
      }));
    } catch (error) {
      this.logger.error(`Error getting most searched universities: ${error.message}`, error.stack);
      return [];
    }
  }

  /**
   * Get search trends over time
   */
  async getSearchTrends(interval: string = '1d'): Promise<Array<{ date: string; count: number }>> {
    try {
      const response = await this.elasticsearchService.search(this.USER_EVENTS_INDEX, {
        query: {
          term: { eventType: 'search' }
        },
        aggs: {
          search_trends: {
            date_histogram: {
              field: 'timestamp',
              calendar_interval: interval
            }
          }
        },
        size: 0
      });

      return response.aggregations.search_trends.buckets.map(bucket => ({
        date: bucket.key_as_string,
        count: bucket.doc_count
      }));
    } catch (error) {
      this.logger.error(`Error getting search trends: ${error.message}`, error.stack);
      return [];
    }
  }
} 