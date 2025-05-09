import { Module } from '@nestjs/common';
import { ChatAnalyticsService } from 'src/chat/chat-analytics.service';
import { UniversityModelsModule } from 'src/universities/university-models.module';
import { ApplicationMetricsAnalyticsService } from '../applications/services/application-metrics-analytics.service';
import { ElasticsearchModule } from '../elasticsearch/elasticsearch.module';
import { AnalyticsController } from './controllers/analytics.controller';
import { AnalyticsEsInitService } from './services/analytics-es-init.service';
import { SearchHistoryAnalyticsService } from './services/search-history-analytics.service';
import { ConversationModelModule } from 'src/chat/conversation-models.module';

@Module({
  imports: [ElasticsearchModule, UniversityModelsModule, ConversationModelModule],
  controllers: [AnalyticsController],
  providers: [SearchHistoryAnalyticsService, AnalyticsEsInitService, ApplicationMetricsAnalyticsService, ChatAnalyticsService],
  exports: [SearchHistoryAnalyticsService],
})
export class AnalyticsModule {} 