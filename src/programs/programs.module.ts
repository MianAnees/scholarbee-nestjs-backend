import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalyticsModule } from 'src/analytics/analytics.module';
import { SearchHistoryAnalyticsService } from 'src/analytics/services/search-history-analytics.service';
import { ElasticsearchModule } from 'src/elasticsearch/elasticsearch.module';
import { ProgramsController } from './controllers/programs.controller';
import { Program, ProgramSchema } from './schemas/program.schema';
import { ProgramsService } from './services/programs.service';

@Module({
    imports: [
        AnalyticsModule,
        ElasticsearchModule,
        MongooseModule.forFeature([
            { name: Program.name, schema: ProgramSchema }
        ])
    ],
    controllers: [ProgramsController],
    providers: [ProgramsService,  SearchHistoryAnalyticsService],
    exports: [ProgramsService]
})
export class ProgramsModule { } 