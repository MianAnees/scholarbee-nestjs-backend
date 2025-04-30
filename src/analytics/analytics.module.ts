import { Module } from '@nestjs/common';
import { ElasticsearchModule } from '../elasticsearch/elasticsearch.module';
import { UserEventLoggerService } from './services/user-event-logger.service';
import { AnalyticsEsInitService } from './services/analytics-es-init.service';

@Module({
  imports: [ElasticsearchModule],
  providers: [
    UserEventLoggerService, 
    AnalyticsEsInitService
  ],
  exports: [
    UserEventLoggerService
  ],
})
export class AnalyticsModule {} 