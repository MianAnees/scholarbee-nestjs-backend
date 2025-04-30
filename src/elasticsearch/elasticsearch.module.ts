import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ElasticsearchModule as NestElasticsearchModule } from '@nestjs/elasticsearch';
import { ElasticsearchService } from './elasticsearch.service';
import { ElasticsearchController } from './elasticsearch.controller';
import { ElasticsearchInitService } from './elasticsearch-init.service';

@Module({
  imports: [
    NestElasticsearchModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        node: configService.get('elasticsearch.serverUrl'),
        auth: {
          apiKey: configService.get('elasticsearch.apiKey'),
          // username: configService.get('elasticsearch.username'),
          // password: configService.get('elasticsearch.password'),
        },
        tls: {
          rejectUnauthorized: false
        },
        maxRetries: 3,
        requestTimeout: 10000,
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [ElasticsearchController],
  providers: [ElasticsearchService, ElasticsearchInitService],
  exports: [ElasticsearchService],
})
export class ElasticsearchModule {} 