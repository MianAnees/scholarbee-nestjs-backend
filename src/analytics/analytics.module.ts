import { Module } from '@nestjs/common';
import { ElasticsearchModule } from '../elasticsearch/elasticsearch.module';
import { AnalyticsController } from './controllers/analytics.controller';
import { AnalyticsEsInitService } from './services/analytics-es-init.service';
import { SearchHistoryAnalyticsService } from './services/search-history-analytics.service';
import { UniversityModelsModule } from 'src/universities/university-models.module';

@Module({
  imports: [ElasticsearchModule, UniversityModelsModule],
  controllers: [AnalyticsController],
  providers: [SearchHistoryAnalyticsService, AnalyticsEsInitService],
  exports: [SearchHistoryAnalyticsService],
})
export class AnalyticsModule {} 