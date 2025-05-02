import { Module } from '@nestjs/common';
import { ElasticsearchModule } from '../elasticsearch/elasticsearch.module';
import { AnalyticsController } from './controllers/analytics.controller';
import { AnalyticsEsInitService } from './services/analytics-es-init.service';
import { SearchHistoryAnalyticsService } from './services/search-history-analytics.service';

@Module({
  imports: [ElasticsearchModule],
  controllers: [AnalyticsController],
  providers: [
    SearchHistoryAnalyticsService, 
    AnalyticsEsInitService
  ],
  exports: [
    SearchHistoryAnalyticsService,
  ],
})
export class AnalyticsModule {} 