import { Module } from '@nestjs/common';
import { ElasticsearchModule } from '../elasticsearch/elasticsearch.module';
import { UserEventLoggerService } from './services/user-event-logger.service';

@Module({
  imports: [ElasticsearchModule],
  providers: [UserEventLoggerService],
  exports: [UserEventLoggerService],
})
export class AnalyticsModule {} 