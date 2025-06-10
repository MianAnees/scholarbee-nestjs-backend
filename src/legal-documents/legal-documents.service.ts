import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, RootFilterQuery } from 'mongoose';
import {
  LegalDocument,
  LegalDocumentDocument,
} from './schemas/legal-document.schema';
import { QueryLegalDocumentsDto } from './dto/query-legal-documents.dto';

@Injectable()
export class LegalDocumentsService {
  constructor(
    @InjectModel(LegalDocument.name)
    private legalDocumentModel: Model<LegalDocumentDocument>,
  ) {}

  async findAll(queryDto: QueryLegalDocumentsDto): Promise<LegalDocument[]> {
    const filter: RootFilterQuery<LegalDocument> = {};

    if (queryDto.document_type) {
      filter.document_type = queryDto.document_type;
    }

    // Default to 'active' status if no status is provided
    const status = queryDto.status;

    // Only apply status filter if it's not 'all' (All means regardles of status)
    if (status !== 'all') {
      filter.status = status;
    }

    return this.legalDocumentModel.find(filter).select('-content').exec();
  }

  async findById(id: string): Promise<LegalDocument | null> {
    return this.legalDocumentModel.findById(id).exec();
  }
}
