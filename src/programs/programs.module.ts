import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProgramsController } from './controllers/programs.controller';
import { ProgramsService } from './services/programs.service';
import { Program, ProgramSchema } from './schemas/program.schema';
import { AnalyticsModule } from 'src/analytics/analytics.module';

@Module({
    imports: [
        AnalyticsModule,
        MongooseModule.forFeature([
            { name: Program.name, schema: ProgramSchema }
        ])
    ],
    controllers: [ProgramsController],
    providers: [ProgramsService],
    exports: [ProgramsService]
})
export class ProgramsModule { } 