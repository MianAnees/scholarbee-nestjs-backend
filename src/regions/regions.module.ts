import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RegionsController } from './controllers/regions.controller';
import { RegionsService } from './services/regions.service';
import { Region, RegionSchema } from './schemas/region.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Region.name, schema: RegionSchema }
        ])
    ],
    controllers: [RegionsController],
    providers: [RegionsService],
    exports: [RegionsService]
})
export class RegionsModule { } 