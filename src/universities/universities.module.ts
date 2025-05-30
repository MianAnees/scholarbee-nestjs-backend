import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Admission, AdmissionSchema } from '../admissions/schemas/admission.schema';
import { AnalyticsModule } from '../analytics/analytics.module';
import { Campus, CampusSchema } from '../campuses/schemas/campus.schema';
import { ElasticsearchModule } from '../elasticsearch/elasticsearch.module';
import { Program, ProgramSchema } from '../programs/schemas/program.schema';
import { UniversitiesController } from './universities.controller';
import { UniversitiesService } from './universities.service';
import { UniversityModelsModule } from './university-models.module';

@Module({
  imports: [
    UniversityModelsModule,
    MongooseModule.forFeature([
      { name: Program.name, schema: ProgramSchema },
      { name: Campus.name, schema: CampusSchema },
      { name: Admission.name, schema: AdmissionSchema },
    ]),
    AnalyticsModule,
    ElasticsearchModule,
  ],
  controllers: [UniversitiesController],
  providers: [UniversitiesService],
  exports: [UniversitiesService],
})
export class UniversitiesModule {}