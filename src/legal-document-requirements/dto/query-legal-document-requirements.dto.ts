import { IsEnum, IsOptional } from 'class-validator';
import { LegalActionType } from '../schemas/legal-document-requirement.schema';

export class QueryLegalDocumentRequirementsDto {
  @IsOptional()
  @IsEnum(LegalActionType)
  applicable_on?: LegalActionType;
}
