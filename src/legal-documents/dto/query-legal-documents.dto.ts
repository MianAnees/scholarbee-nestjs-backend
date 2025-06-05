import { IsOptional, IsString, IsEnum } from 'class-validator';

export class QueryLegalDocumentsDto {
  @IsOptional()
  @IsEnum([
    'general_terms_and_conditions',
    'application_terms_and_conditions',
    'scholarship_terms_and_conditions',
    'privacy_policy',
    'contract',
    'nda',
    'disclaimer',
    'refund_policy',
    'cookie_policy',
    'acceptable_use_policy',
    'copyright_policy',
    'eula',
    'sla',
    'partnership_agreement',
    'vendor_agreement',
    'data_processing_addendum',
    'user_agreement',
    'subscription_agreement',
    'other',
  ])
  document_type?: string;
}
