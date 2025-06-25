import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ElasticsearchService } from './elasticsearch.service';

// TODO: Remove this controller after testing
@Controller('elasticsearch')
export class ElasticsearchController {
  constructor(private readonly elasticsearchService: ElasticsearchService) {}


  @Put('index/:index/document/:id')
  async indexDocument(
    @Param('index') index: string,
    @Param('id') id: string,
    @Body() document: Record<string, any>,
  ) {
    console.log(` document:`, document)
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
    @Body() query: Record<string, unknown>,
  ) {
    return await this.elasticsearchService.search(index, query)
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
} 