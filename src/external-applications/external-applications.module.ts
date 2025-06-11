import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ExternalApplicationsService } from './external-applications.service';
import { ExternalApplicationsController } from './external-applications.controller';
import {
  ExternalApplication,
  ExternalApplicationSchema,
} from './schemas/external-application.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ExternalApplication.name, schema: ExternalApplicationSchema },
    ]),
  ],
  controllers: [ExternalApplicationsController],
  providers: [ExternalApplicationsService],
  exports: [ExternalApplicationsService],
})
export class ExternalApplicationsModule {}
