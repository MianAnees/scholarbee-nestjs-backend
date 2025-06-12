import {
  Body,
  Controller,
  Get,
  NotImplementedException,
  Post,
  Query,
  UseGuards,
  Param,
  UseInterceptors,
} from '@nestjs/common';
import { ApplicationMetricRegisterEventDto } from 'src/applications/dto/application-analytics.dto';
import { ApplicationMetricsAnalyticsService } from 'src/analytics/services/application-metrics.analytics.service';
import { ChatAnalyticsService } from 'src/analytics/services/chat.analytics.service';
import { QueryAnalyticsCommonDto } from '../dto/query-analytics.dto';
import { SearchHistoryAnalyticsService } from '../services/search-history.analytics.service';
import { ResourceProtectionGuard } from 'src/auth/guards/resource-protection.guard';
import { AuthReq } from 'src/auth/decorators/auth-req.decorator';
import { AuthenticatedRequest } from 'src/auth/types/auth.interface';
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor';
import { ExternalApplicationsService } from 'src/external-applications/external-applications.service';
import { ApplicationsService } from 'src/applications/services/applications.service';
import { StudentScholarshipsService } from 'src/student-scholarships/services/student-scholarships.service';

// Authenticated with Guard
@UseGuards(ResourceProtectionGuard)
@UseInterceptors(ResponseInterceptor)
@Controller('analytics')
export class AnalyticsController {
  constructor(
    private readonly searchHistoryAnalyticsService: SearchHistoryAnalyticsService,
    private readonly applicationMetricsAnalyticsService: ApplicationMetricsAnalyticsService,
    private readonly chatAnalyticsService: ChatAnalyticsService,
    private readonly externalApplicationsService: ExternalApplicationsService,
    private readonly applicationsService: ApplicationsService,
    private readonly studentScholarshipsService: StudentScholarshipsService,
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
  async getApplicationProgress(@Query() query: QueryAnalyticsCommonDto) {
    return this.applicationMetricsAnalyticsService.getOverallMetrics(query);
  }

  @Get('application-metrics/daily-breakdown')
  async getDailyApplicationMetrics(@Query() query: QueryAnalyticsCommonDto) {
    return this.applicationMetricsAnalyticsService.getDailyApplicationMetrics(
      query,
    );
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
  async getResponseAnalyticsForSpecificCampus(
    @Param('campusId') campusId: string,
  ) {
    return this.chatAnalyticsService.getResponseAnalyticsForSpecificCampus(
      campusId,
    );
  }

  @Get('chat/response/university/:universityId')
  async getResponseAnalyticsForSpecificUniversity(
    @Param('universityId') universityId: string,
  ) {
    return this.chatAnalyticsService.getResponseAnalyticsForSpecificUniversity(
      universityId,
    );
  }

  @Get('chat/response/universities')
  async getResponseAnalyticsForAllUniversities(@Query('limit') limit?: string) {
    const parsedLimit = Number(limit);
    return this.chatAnalyticsService.getResponseAnalyticsForAllUniversities(
      !isNaN(parsedLimit) && parsedLimit > 0 ? parsedLimit : 10,
    );
  }

  @Get('chat/response/campuses')
  async getResponseAnalyticsForAllCampuses(@Query('limit') limit?: string) {
    const parsedLimit = Number(limit);
    return this.chatAnalyticsService.getResponseAnalyticsForAllCampuses(
      !isNaN(parsedLimit) && parsedLimit > 0 ? parsedLimit : 10,
    );
  }

  @Get('external-program-applications')
  async getExternalApplicationsAnalytics() {
    return this.externalApplicationsService.getAnalytics();
  }

  @Get('program-applications')
  async getApplicationsAnalytics() {
    return this.applicationsService.getApplicationsAnalytics();
  }

  @Get('scholarship-applications')
  async getScholarshipApplicationsAnalytics() {
    return this.studentScholarshipsService.getScholarshipApplicationsAnalytics();
  }
}
