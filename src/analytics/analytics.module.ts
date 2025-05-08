import { Module } from '@nestjs/common';
import { ElasticsearchModule } from '../elasticsearch/elasticsearch.module';
import { AnalyticsController } from './controllers/analytics.controller';
import { AnalyticsEsInitService } from './services/analytics-es-init.service';
import { SearchHistoryAnalyticsService } from './services/search-history-analytics.service';
import { UniversityModelsModule } from 'src/universities/university-models.module';
import { ApplicationMetricsAnalyticsService } from '../applications/services/application-metrics-analytics.service';

@Module({
  imports: [ElasticsearchModule, UniversityModelsModule],
  controllers: [AnalyticsController],
  providers: [SearchHistoryAnalyticsService, AnalyticsEsInitService, ApplicationMetricsAnalyticsService],
  exports: [SearchHistoryAnalyticsService],
})
export class AnalyticsModule {} 