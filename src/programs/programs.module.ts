import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalyticsModule } from 'src/analytics/analytics.module';
import { ElasticsearchModule } from 'src/elasticsearch/elasticsearch.module';
import { UniversityModelsModule } from 'src/universities/university-models.module';
import { ProgramsController } from './controllers/programs.controller';
import { Program, ProgramSchema } from './schemas/program.schema';
import { ProgramsService } from './services/programs.service';

@Module({
  imports: [
    AnalyticsModule,
    ElasticsearchModule,
    UniversityModelsModule,
    MongooseModule.forFeature([{ name: Program.name, schema: ProgramSchema }]),
  ],
  controllers: [ProgramsController],
  providers: [
    ProgramsService,
  ],
  exports: [ProgramsService],
})
export class ProgramsModule {}
