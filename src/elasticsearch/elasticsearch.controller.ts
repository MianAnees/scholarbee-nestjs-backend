import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ElasticsearchService } from './elasticsearch.service';
import { DEFAULT_ES_INDICES } from './elasticsearch.config';

@Controller('elasticsearch')
export class ElasticsearchController {
  constructor(private readonly elasticsearchService: ElasticsearchService) {}

  @Get('index/:index')
  async indexExists(@Param('index') index: string) {
    return { exists: await this.elasticsearchService.indexExists(index) };
  }

  @Post('index/:index')
  async createIndex(
    @Param('index') index: string,
    @Body() body: { settings?: Record<string, any>; mappings?: Record<string, any> },
  ) {
    return {
      success: await this.elasticsearchService.createIndex(
        index,
        body.settings,
        body.mappings,
      ),
    };
  }

  @Put('index/:index/document/:id')
  async indexDocument(
    @Param('index') index: string,
    @Param('id') id: string,
    @Body() document: Record<string, any>,
  ) {
    return {
      success: await this.elasticsearchService.indexDocument(index, id, document),
    };
  }

  @Post('bulk')
  async bulk(@Body() operations: any[]) {
    return { success: await this.elasticsearchService.bulk(operations) };
  }

  @Post('search/:index')
  async search(
    @Param('index') index: string,
    @Body() query: any,
  ) {
    return await this.elasticsearchService.search(index, query);
  }

  @Delete('index/:index/document/:id')
  async deleteDocument(
    @Param('index') index: string,
    @Param('id') id: string,
  ) {
    return {
      success: await this.elasticsearchService.deleteDocument(index, id),
    };
  }

  @Post('index/:index/document/:id/update')
  async updateDocument(
    @Param('index') index: string,
    @Param('id') id: string,
    @Body() doc: Record<string, any>,
  ) {
    return {
      success: await this.elasticsearchService.updateDocument(index, id, doc),
    };
  }

  @Get('index/:index/document/:id')
  async getDocument(
    @Param('index') index: string,
    @Param('id') id: string,
  ) {
    return await this.elasticsearchService.getDocument(index, id);
  }

  @Delete('index/:index')
  async deleteIndex(@Param('index') index: string) {
    return { success: await this.elasticsearchService.deleteIndex(index) };
  }

  // Convenience endpoints for specific indices
  @Get('programs/:id')
  async getProgram(@Param('id') id: string) {
    return await this.elasticsearchService.getDocument(
      DEFAULT_ES_INDICES.PROGRAMS,
      id,
    );
  }

  @Get('universities/:id')
  async getUniversity(@Param('id') id: string) {
    return await this.elasticsearchService.getDocument(
      DEFAULT_ES_INDICES.UNIVERSITIES,
      id,
    );
  }

  @Post('search/programs')
  async searchPrograms(@Body() query: any) {
    return await this.elasticsearchService.search(DEFAULT_ES_INDICES.PROGRAMS, query);
  }

  @Post('search/universities')
  async searchUniversities(@Body() query: any) {
    return await this.elasticsearchService.search(DEFAULT_ES_INDICES.UNIVERSITIES, query);
  }
} 