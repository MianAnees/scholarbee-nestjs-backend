import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UniversitiesService } from './universities.service';
import { UniversitiesController } from './universities.controller';
import { Program, ProgramSchema } from '../programs/schemas/program.schema';
import { Campus, CampusSchema } from '../campuses/schemas/campus.schema';
import { AnalyticsModule } from '../analytics/analytics.module';
import { ElasticsearchModule } from '../elasticsearch/elasticsearch.module';
import { MappingRegistryService } from 'src/elasticsearch/services/mapping-registry.service';
import { UniversityModelsModule } from './university-models.module';

@Module({
  imports: [
    UniversityModelsModule,
    MongooseModule.forFeature([
      { name: Program.name, schema: ProgramSchema },
      { name: Campus.name, schema: CampusSchema },
    ]),
    AnalyticsModule,
    ElasticsearchModule,
  ],
  controllers: [UniversitiesController],
  providers: [UniversitiesService, MappingRegistryService],
  exports: [UniversitiesService],
})
export class UniversitiesModule {}