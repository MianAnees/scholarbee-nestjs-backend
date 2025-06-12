import { Module } from '@nestjs/common';
import { ChatAnalyticsService } from 'src/analytics/services/chat.analytics.service';
import { UniversityModelsModule } from 'src/universities/university-models.module';
import { ApplicationMetricsAnalyticsService } from './services/application-metrics.analytics.service';
import { ElasticsearchModule } from '../elasticsearch/elasticsearch.module';
import { AnalyticsController } from './controllers/analytics.controller';
import { SearchHistoryAnalyticsService } from './services/search-history.analytics.service';
import { ConversationModelModule } from 'src/chat/conversation-models.module';
import { ExternalApplicationsModule } from 'src/external-applications/external-applications.module';

@Module({
  imports: [
    ElasticsearchModule,
    UniversityModelsModule,
    ConversationModelModule,
    ExternalApplicationsModule,
  ],
  controllers: [AnalyticsController],
  providers: [
    SearchHistoryAnalyticsService,
    ApplicationMetricsAnalyticsService,
    ChatAnalyticsService,
  ],
  exports: [SearchHistoryAnalyticsService],
})
export class AnalyticsModule {}
