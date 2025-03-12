import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CampusesService } from './campuses.service';
import { CampusesController } from './campuses.controller';
import { Campus, CampusSchema } from './schemas/campus.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Campus.name, schema: CampusSchema },
        ]),
    ],
    controllers: [CampusesController],
    providers: [CampusesService],
    exports: [CampusesService],
})
export class CampusesModule { } 