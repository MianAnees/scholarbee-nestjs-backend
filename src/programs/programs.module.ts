import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProgramsEsInitService } from 'src/admission-programs/services/programs-es-init.service';
import { AnalyticsModule } from 'src/analytics/analytics.module';
import { ElasticsearchModule } from 'src/elasticsearch/elasticsearch.module';
import { UniversityModelsModule } from 'src/universities/university-models.module';
import { ProgramsController } from './controllers/programs.controller';
import { Program, ProgramSchema } from './schemas/program.schema';
import { ProgramsService } from './services/programs.service';
import { SearchHistoryAnalyticsService } from 'src/analytics/services/search-history-analytics.service';

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
    // SearchHistoryAnalyticsService, // AnalyticsModule already provides this,
    ProgramsEsInitService, // Add the new initialization service
  ],
  exports: [ProgramsService],
})
export class ProgramsModule {}
