import { IsOptional, IsEnum } from 'class-validator';
import {
  LegalDocumentStatus,
  LegalDocumentType,
} from '../schemas/legal-document.schema';

export class QueryLegalDocumentsDto {
  @IsOptional()
  @IsEnum(LegalDocumentType)
  document_type: LegalDocumentType;

  @IsOptional()
  @IsEnum(LegalDocumentStatus)
  status?: LegalDocumentStatus;
}
