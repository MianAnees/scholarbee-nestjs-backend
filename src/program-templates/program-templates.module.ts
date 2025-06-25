import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProgramTemplatesController } from './controllers/program-templates.controller';
import { ProgramTemplatesService } from './services/program-templates.service';
import { ProgramTemplate, ProgramTemplateSchema } from './schemas/program-template.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: ProgramTemplate.name, schema: ProgramTemplateSchema }
        ])
    ],
    controllers: [ProgramTemplatesController],
    providers: [ProgramTemplatesService],
    exports: [ProgramTemplatesService]
})
export class ProgramTemplatesModule { } 