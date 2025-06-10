import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, RootFilterQuery } from 'mongoose';
import {
  LegalDocument,
  LegalDocumentDocument,
  LegalDocumentStatus,
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

    // Filter by document type if provided
    if (queryDto.document_type) {
      filter.document_type = queryDto.document_type;
    }

    // If status is provided, apply status filter; otherwise, return all documents regardless of status
    if (queryDto.status) {
      filter.status = queryDto.status;
    }

    return this.legalDocumentModel.find(filter).select('-content').exec();
  }

  async findById(id: string): Promise<LegalDocument | null> {
    return this.legalDocumentModel.findById(id).exec();
  }
}
