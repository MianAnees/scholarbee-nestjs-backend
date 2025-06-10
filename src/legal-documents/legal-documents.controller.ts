import { Controller, Get, Param, Query } from '@nestjs/common';
import { LegalDocumentsService } from './legal-documents.service';
import { LegalDocument } from './schemas/legal-document.schema';
import { QueryLegalDocumentsDto } from './dto/query-legal-documents.dto';

@Controller('legal-documents')
export class LegalDocumentsController {
  constructor(private readonly legalDocumentsService: LegalDocumentsService) {}

  @Get()
  async findAll(
    @Query() queryDto: QueryLegalDocumentsDto,
  ): Promise<LegalDocument[]> {
    return this.legalDocumentsService.findAll(queryDto);
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<LegalDocument | null> {
    return this.legalDocumentsService.findById(id);
  }
}
