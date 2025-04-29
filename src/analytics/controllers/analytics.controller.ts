import { Controller, Get, Query } from '@nestjs/common';
import { UserEventLoggerService } from '../services/user-event-logger.service';

@Controller('analytics')
export class AnalyticsController {
    constructor(private readonly userEventLogger: UserEventLoggerService) {}

    @Get('search-trends')
    async getSearchTrends(@Query('interval') interval: string = '1d') {
        return this.userEventLogger.getSearchTrends(interval);
    }

    @Get('most-searched-majors')
    async getMostSearchedMajors(@Query('limit') limit: number = 10) {
        return this.userEventLogger.getMostSearchedMajors(limit);
    }

    @Get('most-searched-degree-levels')
    async getMostSearchedDegreeLevels(@Query('limit') limit: number = 10) {
        return this.userEventLogger.getMostSearchedDegreeLevels(limit);
    }

    @Get('most-searched-universities')
    async getMostSearchedUniversities(@Query('limit') limit: number = 10) {
        return this.userEventLogger.getMostSearchedUniversities(limit);
    }
} 