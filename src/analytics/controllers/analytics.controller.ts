import { Controller, Get, Query, Req } from '@nestjs/common';
import { SearchHistoryAnalyticsService } from '../services/search-history-analytics.service';
import { Request } from 'express';
// src/analytics/dto/query-most-searched-majors.dto.ts
import { IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { QueryMostSearchedMajorsDto } from '../dto/query-most-searched-majors.dto';

@Controller('analytics')
export class AnalyticsController {
    constructor(private readonly searchHistoryAnalyticsService: SearchHistoryAnalyticsService) {}

    @Get('search-trends')
    async getSearchTrends(@Query('interval') interval: string = '1d') {
        throw new Error('Not implemented');
        // return this.searchHistoryAnalyticsService.getSearchTrends(interval);
    }

    @Get('most-searched-majors')
    async getMostSearchedMajors(
        @Query() query: QueryMostSearchedMajorsDto,
        @Req() req: Request
    ) {
        return this.searchHistoryAnalyticsService.getMostSearchedMajors(query);
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