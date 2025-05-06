import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ElasticsearchModule as NestElasticsearchModule } from '@nestjs/elasticsearch';
import { ElasticsearchService } from './elasticsearch.service';
import { ElasticsearchController } from './elasticsearch.controller';
import { MappingRegistryService } from './services/mapping-registry.service';

@Module({
  imports: [
    NestElasticsearchModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        node: configService.get('elasticsearch.serverUrl'),
        auth: {
          apiKey: configService.get('elasticsearch.apiKey'),
        },
        tls: {
          // requestCert: true,
          // rejectUnauthorized: false,
        },
        maxRetries: 0, // TODO: Change to 3
        requestTimeout: 10000,
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [ElasticsearchController],
  providers: [ElasticsearchService, MappingRegistryService],
  exports: [ElasticsearchService, MappingRegistryService],
})
export class ElasticsearchModule {} 