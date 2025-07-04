import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
} from '@nestjs/common';
import { LegalDocumentRequirementsService } from './legal-document-requirements.service';
import { LegalDocumentRequirement } from './schemas/legal-document-requirement.schema';
import { QueryLegalDocumentRequirementsDto } from './dto/query-legal-document-requirements.dto';

@Controller('legal-document-requirements')
export class LegalDocumentRequirementsController {
  constructor(
    private readonly legalDocumentRequirementsService: LegalDocumentRequirementsService,
  ) {}

  @Get()
  async findAll(
    @Query() queryDto: QueryLegalDocumentRequirementsDto,
  ): Promise<LegalDocumentRequirement[]> {
    return this.legalDocumentRequirementsService.findAll(queryDto);
  }

  @Get(':id')
  async findById(
    @Param('id') id: string,
  ): Promise<LegalDocumentRequirement | null> {
    return this.legalDocumentRequirementsService.findById(id);
  }
}
