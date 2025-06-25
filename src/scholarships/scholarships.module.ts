import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScholarshipsController } from './controllers/scholarships.controller';
import { ScholarshipsService } from './services/scholarships.service';
import { Scholarship, ScholarshipSchema } from './schemas/scholarship.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Scholarship.name, schema: ScholarshipSchema }
        ])
    ],
    controllers: [ScholarshipsController],
    providers: [ScholarshipsService],
    exports: [ScholarshipsService]
})
export class ScholarshipsModule { } 