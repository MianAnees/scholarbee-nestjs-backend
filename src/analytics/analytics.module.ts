import { Module } from '@nestjs/common';
import { ElasticsearchModule } from '../elasticsearch/elasticsearch.module';
import { AnalyticsEsInitService } from './services/analytics-es-init.service';
import { SearchHistoryAnalyticsService } from './services/search-history-analytics.service';

@Module({
  imports: [ElasticsearchModule],
  providers: [
    SearchHistoryAnalyticsService, 
    AnalyticsEsInitService
  ],
  exports: [
    SearchHistoryAnalyticsService
  ],
})
export class AnalyticsModule {} 