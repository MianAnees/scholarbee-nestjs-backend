import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
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
    const query = this.legalDocumentModel.find();

    if (queryDto.document_type) {
      query.where({ document_type: queryDto.document_type });
    }

    return query.exec();
  }

  async findById(id: string): Promise<LegalDocument | null> {
    return this.legalDocumentModel.findById(id).exec();
  }
}
