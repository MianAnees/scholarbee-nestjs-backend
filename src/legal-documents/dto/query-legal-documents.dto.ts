import { IsOptional, IsEnum, IsArray, IsString } from 'class-validator';
import {
  LegalDocumentStatus,
  LegalDocumentType,
} from '../schemas/legal-document.schema';
import { IsObjectId } from 'src/common/validators/object-id.validator';
import { Types } from 'mongoose';
import { ToObjectId } from 'src/common/transformers/object-id.transformer';

export class QueryLegalDocumentsDto {
  @IsOptional()
  @IsEnum(LegalDocumentType)
  document_type?: LegalDocumentType;
  @IsOptional()
  @IsArray()
  @IsEnum(LegalDocumentType, { each: true })
  document_types?: LegalDocumentType[];

  @IsOptional()
  @IsEnum(LegalDocumentStatus)
  status?: LegalDocumentStatus;

  // field to filter with the IDs of the documents
  @IsOptional()
  @IsArray()
  @IsObjectId({
    each: true,
    message: 'Each document ID must be a valid MongoDB ObjectId',
  })
  @ToObjectId()
  document_ids?: Types.ObjectId[];
}
