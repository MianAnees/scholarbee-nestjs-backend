import { Injectable, Logger } from '@nestjs/common';
import { ElasticsearchService } from '../../elasticsearch/elasticsearch.service';
import { ISearchHistory } from '../schemas/search-history.entity';
import { QueryAnalyticsCommonDto } from '../dto/query-analytics.dto';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { University } from 'src/universities/schemas/university.schema';
import { UniversityDocument } from 'src/universities/schemas/university.schema';

@Injectable()
export class SearchHistoryAnalyticsService {
  private readonly logger = new Logger(SearchHistoryAnalyticsService.name);
  private readonly SEARCH_HISTORY_INDEX = 'search_history';

  constructor(
    private readonly elasticsearchService: ElasticsearchService,
    @InjectModel(University.name)
    private universityModel: Model<UniversityDocument>,
  ) {}

  /**
   * Log a user event to Elasticsearch
   */
  async indexDocument(searchHistory: ISearchHistory): Promise<boolean> {
    try {
      const document = {
        ...searchHistory,
        timestamp: searchHistory.timestamp || new Date(),
      };

      return await this.elasticsearchService.indexDocument(
        this.SEARCH_HISTORY_INDEX,
        undefined, // Let Elasticsearch generate the ID
        document,
      );
    } catch (error) {
      this.logger.error(
        `Error logging user event: ${error.message}`,
        error.stack,
      );
      return false;
    }
  }

  /**
   * Get most searched majors from search_history index
   */
  async getMostSearchedMajors(
    queryDto: QueryAnalyticsCommonDto,
  ): Promise<Array<{ major: string; count: number }>> {
    try {
      const response = await this.elasticsearchService.search(
        this.SEARCH_HISTORY_INDEX,
        {
          aggs: {
            top_majors: {
              terms: {
                field: 'data.major.keyword',
                size: queryDto.limit,
              },
            },
          },
          size: 0,
        },
      );

      const aggregationResponse = response.aggregations.top_majors as {
        buckets: { key: string; doc_count: number }[];
      };

      return aggregationResponse.buckets.map((bucket) => ({
        major: bucket.key,
        count: bucket.doc_count,
      }));
    } catch (error) {
      this.logger.error(
        `Error getting most searched majors: ${error.message}`,
        error.stack,
      );
      return [];
    }
  }

  /**
   * Get most searched programs from search_history index
   * TODO: Find the place where this should be indexed. Most probably the `program_id` should be indexed when searching for admission programs or atleast the program name should be indexed when searching for programs
   */
  async getMostSearchedPrograms(
    queryDto: QueryAnalyticsCommonDto,
  ): Promise<Array<{ program: string; count: number }>> {
    try {
      const response = await this.elasticsearchService.search(
        this.SEARCH_HISTORY_INDEX,
        {
          aggs: {
            top_programs: {
              terms: {
                field: 'data.program_name.keyword',
                size: queryDto.limit,
              },
            },
          },
          size: 0,
        },
      );

      const aggregationResponse = response.aggregations.top_programs as {
        buckets: { key: string; doc_count: number }[];
      };

      return aggregationResponse.buckets.map((bucket) => ({
        program: bucket.key,
        count: bucket.doc_count,
      }));
    } catch (error) {
      this.logger.error(
        `Error getting most searched programs: ${error.message}`,
        error.stack,
      );
      return [];
    }
  }

  /**
   * Get most searched universities from search_history index
   */
  async getMostSearchedUniversities(
    queryDto: QueryAnalyticsCommonDto,
  ): Promise<Array<{ university: string; count: number }>> {
    try {
      // get the most searched universities from the search_history index
      const aggregationResponse = await this.elasticsearchService
        .search(this.SEARCH_HISTORY_INDEX, {
          aggs: {
            // this `top_universities` will then be returned in the aggregations object of the response
            top_universities: {
              terms: {
                field: 'data.university_id.keyword',
                size: queryDto.limit,
              },
            },
          },
          size: 0,
        })
        .then((response) => {
          return response.aggregations.top_universities as {
            buckets: { key: string; doc_count: number }[];
          };
        });

      const universityIds = aggregationResponse.buckets.map(
        (bucket) => bucket.key,
      );

      // convert the university_id to university name using mongoose
      const universityDetailList = await this.universityModel
        .find({
          _id: { $in: universityIds },
          // only select the name and _id fields
          select: 'name _id',
        })
        .lean();

      // if count of universityIds is not equal to the count of universitiesInfo, throw an error
      if (universityIds.length !== universityDetailList.length) {
        throw new Error(
          'Count of response is not equal to the count of universitiesInfo',
        );
      }

      let goodResp = [];

      // get a list of aggregation response with the relevant university name and university_id
      for (const bucket of aggregationResponse.buckets) {
        try {
          const matchedUniversity = universityDetailList.find(
            (university) => university._id === bucket.key,
          );

          if (!matchedUniversity) {
            throw new Error('Invalid university_id');
          }

          // check if the bucket.key is one of the valid university_id
          if (!universityIds.includes(bucket.key)) {
            throw new Error('Invalid university_id');
          }

          goodResp.push({
            name: matchedUniversity.name,
            university_id: bucket.key,
            count: bucket.doc_count,
          });
        } catch (error) {
          this.logger.error(
            `University id is not valid while getting most searched universities: ${error.message}`,
            error.stack,
          );
        }
      }

      return goodResp;
    } catch (error) {
      this.logger.error(
        `Error getting most searched universities: ${error.message}`,
        error.stack,
      );
      return [];
    }
  }
}
