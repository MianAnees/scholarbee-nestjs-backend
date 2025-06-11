import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ExternalApplicationsService } from './external-applications.service';
import { ExternalApplicationsController } from './external-applications.controller';
import {
  ExternalApplication,
  ExternalApplicationSchema,
} from './schemas/external-application.schema';
import {
  AdmissionProgram,
  AdmissionProgramSchema,
} from '../admission-programs/schemas/admission-program.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ExternalApplication.name, schema: ExternalApplicationSchema },
      { name: AdmissionProgram.name, schema: AdmissionProgramSchema },
    ]),
  ],
  controllers: [ExternalApplicationsController],
  providers: [ExternalApplicationsService],
  exports: [ExternalApplicationsService],
})
export class ExternalApplicationsModule {}
