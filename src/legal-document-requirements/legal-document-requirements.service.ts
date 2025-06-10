import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, RootFilterQuery } from 'mongoose';
import {
  LegalDocumentRequirement,
  LegalDocumentRequirementDocument,
} from './schemas/legal-document-requirement.schema';
import { QueryLegalDocumentRequirementsDto } from './dto/query-legal-document-requirements.dto';

@Injectable()
export class LegalDocumentRequirementsService {
  constructor(
    @InjectModel(LegalDocumentRequirement.name)
    private legalDocumentRequirementModel: Model<LegalDocumentRequirementDocument>,
  ) {}

  async findAll(
    queryDto: QueryLegalDocumentRequirementsDto,
  ): Promise<LegalDocumentRequirement[]> {
    const filter: RootFilterQuery<LegalDocumentRequirement> = {};

    if (queryDto.applicable_on) {
      filter.applicable_on = queryDto.applicable_on;
    }

    return this.legalDocumentRequirementModel.find(filter).exec();
  }

  async findById(id: string): Promise<LegalDocumentRequirement | null> {
    return this.legalDocumentRequirementModel.findById(id).exec();
  }
}
