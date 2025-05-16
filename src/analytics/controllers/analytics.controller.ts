import {
  Body,
  Controller,
  Get,
  NotImplementedException,
  Post,
  Query,
  UseGuards,
  Param,
} from '@nestjs/common';
import { ApplicationMetricRegisterEventDto } from 'src/applications/dto/application-analytics.dto';
import { ApplicationMetricsAnalyticsService } from 'src/applications/services/application-metrics-analytics.service';
import { ChatAnalyticsService } from 'src/chat/chat-analytics.service';
import { QueryAnalyticsCommonDto } from '../dto/query-analytics.dto';
import { SearchHistoryAnalyticsService } from '../services/search-history-analytics.service';
import { ResourceProtectionGuard } from 'src/auth/guards/resource-protection.guard';
import { AuthReq } from 'src/auth/decorators/auth-req.decorator';
import { AuthenticatedRequest } from 'src/auth/types/auth.interface';

// Authenticated with Guard
@UseGuards(ResourceProtectionGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(
    private readonly searchHistoryAnalyticsService: SearchHistoryAnalyticsService,
    private readonly applicationMetricsAnalyticsService: ApplicationMetricsAnalyticsService,
    private readonly chatAnalyticsService: ChatAnalyticsService,
  ) {}

  @Get('search-trends/most-searched-degree-levels')
  async getMostSearchedDegreeLevels(@Query('limit') limit: number = 10) {
    throw new NotImplementedException('Not implemented');
    // return this.searchHistoryAnalyticsService.getMostSearchedDegreeLevels(limit);
  }

  @Get('search-trends/majors')
  async getMostSearchedMajors(
    @Query() query: QueryAnalyticsCommonDto,
    // @Req() req: Request,
  ) {
    return this.searchHistoryAnalyticsService.getMostSearchedMajors(query);
  }

  @Get('search-trends/programs')
  async getMostSearchedPrograms(@Query() query: QueryAnalyticsCommonDto) {
    return this.searchHistoryAnalyticsService.getMostSearchedPrograms(query);
  }

  @Get('search-trends/universities')
  async getMostSearchedUniversities(@Query() query: QueryAnalyticsCommonDto) {
    return this.searchHistoryAnalyticsService.getMostSearchedUniversities(
      query,
    );
  }

  @Get('application-metrics/universities')
  async getUniversitySpecificMetrics(@Query() query: QueryAnalyticsCommonDto) {
    return this.applicationMetricsAnalyticsService.getMostPopularUniversities(
      query,
    );
  }

  @Get('application-metrics')
  async getApplicationProgress() {
    return this.applicationMetricsAnalyticsService.getOverallMetrics();
  }

  @Post('application-metrics/register-event')
  async registerApplicationMetricEvent(
    @Body() applicationMetric: ApplicationMetricRegisterEventDto,
    @AuthReq() authReq: AuthenticatedRequest,
  ) {
    return this.applicationMetricsAnalyticsService.registerApplicationMetricEvent(
      authReq.user._id,
      applicationMetric,
    );
  }

  @Get('chat/conversations/campus')
  findAllConversationsPerEachCampus() {
    return this.chatAnalyticsService.findAllConversationsPerEachCampus();
  }

  @Get('chat/conversations/university')
  findAllConversationsPerEachUniversity() {
    return this.chatAnalyticsService.findAllConversationsPerEachUniversity();
  }

  @Get('chat/response/campus/:campusId')
  async getCampusChatResponseAnalytics(@Param('campusId') campusId: string) {
    return this.chatAnalyticsService.getCampusChatResponseAnalytics(campusId);
  }

  @Get('chat/response/university/:universityId')
  async getUniversityChatResponseAnalytics(
    @Param('universityId') universityId: string,
  ) {
    return this.chatAnalyticsService.getUniversityChatResponseAnalytics(
      universityId,
    );
  }
}
