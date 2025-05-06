import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AdmissionProgramsController } from './controllers/admission-programs.controller';
import { AdmissionProgramsService } from './services/admission-programs.service';
import { AdmissionProgramsGateway } from './gateways/admission-programs.gateway';
import { AdmissionProgram, AdmissionProgramSchema } from './schemas/admission-program.schema';
import { AnalyticsModule } from 'src/analytics/analytics.module';
import { ElasticsearchModule } from 'src/elasticsearch/elasticsearch.module';
import { UniversityModelsModule } from 'src/universities/university-models.module';
import { SearchHistoryAnalyticsService } from 'src/analytics/services/search-history-analytics.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AdmissionProgram.name, schema: AdmissionProgramSchema },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRATION', '1d'),
        },
      }),
    }),
    AnalyticsModule,
    ElasticsearchModule,
    UniversityModelsModule,
  ],
  controllers: [AdmissionProgramsController],
  providers: [
    AdmissionProgramsService,
    AdmissionProgramsGateway,
    // SearchHistoryAnalyticsService  // AnalyticsModule already provides this,
  ],
  exports: [AdmissionProgramsService],
})
export class AdmissionProgramsModule {} 