import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ElasticsearchModule as NestElasticsearchModule } from '@nestjs/elasticsearch';
import { ElasticsearchService } from './elasticsearch.service';
import { ElasticsearchController } from './elasticsearch.controller';
import { MappingRegistryService } from './services/mapping-registry.service';
import { IConfiguration } from 'src/config/configuration';
import { EnvValidationSchema } from 'src/config';

@Module({
  imports: [
    NestElasticsearchModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService<IConfiguration & EnvValidationSchema>) => ({
        node: configService.get('elasticsearch.serverUrl', { infer: true }),
        auth: {
          username: configService.get('elasticsearch.username', { infer: true }),
          password: configService.get('elasticsearch.password', { infer: true }),
        },
        // tls: {
          // requestCert: true,
          // rejectUnauthorized: false,
        // },
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