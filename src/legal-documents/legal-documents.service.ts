import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, RootFilterQuery } from 'mongoose';
import { BetterOmit } from 'src/utils/typescript.utils';
import { QueryLegalDocumentsDto } from './dto/query-legal-documents.dto';
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

  async findAll(
    queryDto: QueryLegalDocumentsDto,
  ): Promise<BetterOmit<LegalDocument, 'content'>[]> {
    const filter: RootFilterQuery<LegalDocument> = {};

    // throw error if both document_type and document_types are provided
    if (queryDto.document_type && queryDto.document_types) {
      throw new BadRequestException(
        'Cannot provide both document_type and document_types',
      );
    }
    // Filter by document type if provided
    else if (queryDto.document_type) {
      filter.document_type = queryDto.document_type;
    }
    // Filter by document types if provided
    else if (queryDto.document_types) {
      filter.document_type = { $in: queryDto.document_types };
    }

    // If status is provided, apply status filter; otherwise, return all documents regardless of status
    if (queryDto.status) {
      filter.status = queryDto.status;
    }

    // If document_ids is provided, apply document_ids filter
    if (queryDto.document_ids) {
      filter._id = { $in: queryDto.document_ids };
    }

    const results = await this.legalDocumentModel
      .find<LegalDocument>(filter)
      .select<BetterOmit<LegalDocument, 'content'>>('-content')
      .exec();

    return results;
  }

  async findById(id: string): Promise<LegalDocument | null> {
    const document = await this.legalDocumentModel.findById(id).exec();
    console.log('🚀 ~ LegalDocumentsService ~ findById ~ document:', document);
    if (!document) {
      throw new NotFoundException('Legal document not found');
    }
    return document;
  }
}
