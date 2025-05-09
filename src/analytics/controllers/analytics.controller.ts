import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApplicationMetricDto } from 'src/applications/dto/application-analytics.dto';
import { ApplicationMetricsAnalyticsService } from 'src/applications/services/application-metrics-analytics.service';
import { ChatAnalyticsService } from 'src/chat/chat-analytics.service';
import { QueryAnalyticsCommonDto } from '../dto/query-analytics.dto';
import { SearchHistoryAnalyticsService } from '../services/search-history-analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(
    private readonly searchHistoryAnalyticsService: SearchHistoryAnalyticsService,
    private readonly applicationMetricsAnalyticsService: ApplicationMetricsAnalyticsService,
    private readonly chatAnalyticsService: ChatAnalyticsService,
  ) {}

  @Get('search-trends')
  async getSearchTrends(@Query('interval') interval: string = '1d') {
    throw new Error('Not implemented');
    // return this.searchHistoryAnalyticsService.getSearchTrends(interval);
  }

  @Get('most-searched-majors')
  async getMostSearchedMajors(
    @Query() query: QueryAnalyticsCommonDto,
    // @Req() req: Request,
  ) {
    return this.searchHistoryAnalyticsService.getMostSearchedMajors(query);
  }

  @Get('most-searched-degree-levels')
  async getMostSearchedDegreeLevels(@Query('limit') limit: number = 10) {
    throw new Error('Not implemented');
    // return this.searchHistoryAnalyticsService.getMostSearchedDegreeLevels(limit);
  }

  @Get('most-searched-programs')
  async getMostSearchedPrograms(@Query() query: QueryAnalyticsCommonDto) {
    return this.searchHistoryAnalyticsService.getMostSearchedPrograms(query);
  }

  @Get('most-searched-universities')
  async getMostSearchedUniversities(@Query() query: QueryAnalyticsCommonDto) {
    return this.searchHistoryAnalyticsService.getMostSearchedUniversities(
      query,
    );
  }

  @Get('application-metrics/most-popular-universities')
  async getMostPopularUniversities(@Query() query: QueryAnalyticsCommonDto) {
    return this.applicationMetricsAnalyticsService.getMostPopularUniversities(query);
  }

  @Get('application-metrics/application-progress')
  async getApplicationProgress() {
    return this.applicationMetricsAnalyticsService.getApplicationProgress();
  }

  @Post('application-metrics/register-event')
  async registerApplicationMetricEvent(@Body() applicationMetric: ApplicationMetricDto) {
    return this.applicationMetricsAnalyticsService.registerApplicationMetricEvent(applicationMetric);
  }


  @Get('chat/conversations/campus')
  findAllConversationsPerEachCampus() {
    return this.chatAnalyticsService.findAllConversationsPerEachCampus();
  }

  @Get('chat/conversations/university')
  findAllConversationsPerEachUniversity() {
    return this.chatAnalyticsService.findAllConversationsPerEachUniversity();
  }

}
