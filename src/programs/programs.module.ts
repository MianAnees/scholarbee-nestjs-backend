import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProgramsController } from './controllers/programs.controller';
import { ProgramsService } from './services/programs.service';
import { Program, ProgramSchema } from './schemas/program.schema';
import { AnalyticsModule } from 'src/analytics/analytics.module';
import { ProgramsEsInitService } from './services/programs-es-init.service';
import { ElasticsearchModule } from 'src/elasticsearch/elasticsearch.module';

@Module({
    imports: [
        AnalyticsModule,
        ElasticsearchModule,
        MongooseModule.forFeature([
            { name: Program.name, schema: ProgramSchema }
        ])
    ],
    controllers: [ProgramsController],
    providers: [ProgramsService, ProgramsEsInitService],
    exports: [ProgramsService]
})
export class ProgramsModule { } 