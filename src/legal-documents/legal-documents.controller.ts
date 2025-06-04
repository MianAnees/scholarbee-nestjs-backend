import { Controller, Get } from '@nestjs/common';
import { LegalDocumentsService } from './legal-documents.service';
import { LegalDocument } from './schemas/legal-document.schema';

@Controller('legal-documents')
export class LegalDocumentsController {
  constructor(private readonly legalDocumentsService: LegalDocumentsService) {}

  @Get()
  async findAll(): Promise<LegalDocument[]> {
    return this.legalDocumentsService.findAll();
  }
}
