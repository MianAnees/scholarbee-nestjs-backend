import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LegalDocumentsController } from './legal-documents.controller';
import { LegalDocumentsService } from './legal-documents.service';
import {
  LegalDocument,
  LegalDocumentSchema,
} from './schemas/legal-document.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LegalDocument.name, schema: LegalDocumentSchema },
    ]),
  ],
  controllers: [LegalDocumentsController],
  providers: [LegalDocumentsService],
  exports: [LegalDocumentsService],
})
export class LegalDocumentsModule {}
