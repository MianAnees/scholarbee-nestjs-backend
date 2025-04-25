import { Module } from '@nestjs/common';
import { ElasticsearchModule as NestElasticsearchModule } from '@nestjs/elasticsearch';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ElasticsearchService } from './elasticsearch.service';
import { ElasticsearchInitService } from './elasticsearch-init.service';

@Module({
  imports: [
    NestElasticsearchModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        node: configService.get('ELASTICSEARCH_NODE') || 'http://localhost:9200',
        auth: {
          username: configService.get('ELASTICSEARCH_USERNAME') || '',
          password: configService.get('ELASTICSEARCH_PASSWORD') || '',
        },
        maxRetries: 10,
        requestTimeout: 60000,
      }),
    }),
  ],
  providers: [ElasticsearchService, ElasticsearchInitService],
  exports: [ElasticsearchService],
})
export class ElasticsearchModule {} 