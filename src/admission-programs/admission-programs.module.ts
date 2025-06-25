import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalyticsModule } from 'src/analytics/analytics.module';
import { AuthModule } from 'src/auth/auth.module';
import { ElasticsearchModule } from 'src/elasticsearch/elasticsearch.module';
import { UniversityModelsModule } from 'src/universities/university-models.module';
import { AdmissionProgramsController } from './controllers/admission-programs.controller';
import { AdmissionProgramsGateway } from './gateways/admission-programs.gateway';
import {
  AdmissionProgram,
  AdmissionProgramSchema,
} from './schemas/admission-program.schema';
import { AdmissionProgramsService } from './services/admission-programs.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AdmissionProgram.name, schema: AdmissionProgramSchema },
    ]),
    AuthModule,
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