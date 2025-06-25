import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LegalDocumentRequirementsController } from './legal-document-requirements.controller';
import { LegalDocumentRequirementsService } from './legal-document-requirements.service';
import {
  LegalDocumentRequirement,
  LegalDocumentRequirementSchema,
} from './schemas/legal-document-requirement.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: LegalDocumentRequirement.name,
        schema: LegalDocumentRequirementSchema,
      },
    ]),
  ],
  controllers: [LegalDocumentRequirementsController],
  providers: [LegalDocumentRequirementsService],
  exports: [LegalDocumentRequirementsService], // Export service for use in other modules
})
export class LegalDocumentRequirementsModule {}
