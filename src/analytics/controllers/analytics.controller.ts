import { Controller, Get, Query } from '@nestjs/common';
import { SearchHistoryAnalyticsService } from '../services/search-history-analytics.service';

@Controller('analytics')
export class AnalyticsController {
    constructor(private readonly searchHistoryAnalyticsService: SearchHistoryAnalyticsService) {}

    @Get('search-trends')
    async getSearchTrends(@Query('interval') interval: string = '1d') {
        throw new Error('Not implemented');
        // return this.searchHistoryAnalyticsService.getSearchTrends(interval);
    }

    @Get('most-searched-majors')
    async getMostSearchedMajors(@Query('limit') limit: number = 10) {
        throw new Error('Not implemented');
        // return this.searchHistoryAnalyticsService.getMostSearchedMajors(limit);
    }

    @Get('most-searched-degree-levels')
    async getMostSearchedDegreeLevels(@Query('limit') limit: number = 10) {
        throw new Error('Not implemented');
        // return this.searchHistoryAnalyticsService.getMostSearchedDegreeLevels(limit);
    }

    @Get('most-searched-universities')
    async getMostSearchedUniversities(@Query('limit') limit: number = 10) {
        throw new Error('Not implemented');
        // return this.searchHistoryAnalyticsService.getMostSearchedUniversities(limit);
    }
} 