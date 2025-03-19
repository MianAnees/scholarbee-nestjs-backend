import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FeesController } from './controllers/fees.controller';
import { FeesService } from './services/fees.service';
import { Fee, FeeSchema } from './schemas/fee.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Fee.name, schema: FeeSchema }
        ])
    ],
    controllers: [FeesController],
    providers: [FeesService],
    exports: [FeesService]
})
export class FeesModule { } 