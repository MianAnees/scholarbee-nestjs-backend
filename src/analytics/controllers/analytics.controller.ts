import { Controller, Get, Query } from '@nestjs/common';
import { SearchHistoryAnalyticsService } from '../services/search-history-analytics.service';
// src/analytics/dto/query-most-searched-majors.dto.ts
import { QueryMostSearchedMajorsDto } from '../dto/query-most-searched-majors.dto';
import { QueryMostSearchedUniversitiesDto } from '../dto/query-most-searched-universities.dto';

@Controller('analytics')
export class AnalyticsController {
  constructor(
    private readonly searchHistoryAnalyticsService: SearchHistoryAnalyticsService,
  ) {}

  @Get('search-trends')
  async getSearchTrends(@Query('interval') interval: string = '1d') {
    throw new Error('Not implemented');
    // return this.searchHistoryAnalyticsService.getSearchTrends(interval);
  }

  @Get('most-searched-majors')
  async getMostSearchedMajors(
    @Query() query: QueryMostSearchedMajorsDto,
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
  async getMostSearchedPrograms(@Query('limit') limit: number = 10) {
    return this.searchHistoryAnalyticsService.getMostSearchedPrograms(limit);
  }

  @Get('most-searched-universities')
  async getMostSearchedUniversities(
    @Query() query: QueryMostSearchedUniversitiesDto,
  ) {
    return this.searchHistoryAnalyticsService.getMostSearchedUniversities(
      query,
    );
  }
}
