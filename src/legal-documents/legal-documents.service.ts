import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  LegalDocument,
  LegalDocumentDocument,
} from './schemas/legal-document.schema';

@Injectable()
export class LegalDocumentsService {
  constructor(
    @InjectModel(LegalDocument.name)
    private legalDocumentModel: Model<LegalDocumentDocument>,
  ) {}

  async findAll(): Promise<LegalDocument[]> {
    return this.legalDocumentModel.find().exec();
  }
}
