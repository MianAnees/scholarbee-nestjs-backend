import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProgramsController } from './controllers/programs.controller';
import { ProgramsService } from './services/programs.service';
import { Program, ProgramSchema } from './schemas/program.schema';
import { University, UniversitySchema } from '../universities/schemas/university.schema';
import { Campus, CampusSchema } from '../campuses/schemas/campus.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Program.name, schema: ProgramSchema },
            { name: University.name, schema: UniversitySchema },
            { name: Campus.name, schema: CampusSchema },
        ])
    ],
    controllers: [ProgramsController],
    providers: [ProgramsService],
    exports: [ProgramsService]
})
export class ProgramsModule { } 