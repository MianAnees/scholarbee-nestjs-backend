import { Controller, Get, Query, Post, Body, UsePipes, ValidationPipe } from '@nestjs/common';
import { SearchHistoryAnalyticsService } from '../services/search-history-analytics.service';
import { QueryAnalyticsCommonDto } from '../dto/query-analytics.dto';
import { ApplicationMetricsAnalyticsService, ApplicationMetricDto } from '../../applications/services/application-metrics-analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(
    private readonly searchHistoryAnalyticsService: SearchHistoryAnalyticsService,
    private readonly applicationMetricsAnalyticsService: ApplicationMetricsAnalyticsService,
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

  @Post('application-metrics/index')
  async indexApplicationMetric(@Body() applicationMetric: ApplicationMetricDto) {
    return this.applicationMetricsAnalyticsService.indexApplicationMetric(applicationMetric);
  }
}
