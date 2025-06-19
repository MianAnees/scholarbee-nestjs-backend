import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum LegalDocumentType {
  GENERAL_TERMS_AND_CONDITIONS = 'general_terms_and_conditions',
  APPLICATION_TERMS_AND_CONDITIONS = 'application_terms_and_conditions',
  SCHOLARSHIP_TERMS_AND_CONDITIONS = 'scholarship_terms_and_conditions',
  PRIVACY_POLICY = 'privacy_policy',
  CONTRACT = 'contract',
  NDA = 'nda',
  DISCLAIMER = 'disclaimer',
  REFUND_POLICY = 'refund_policy',
  COOKIE_POLICY = 'cookie_policy',
  ACCEPTABLE_USE_POLICY = 'acceptable_use_policy',
  COPYRIGHT_POLICY = 'copyright_policy',
  EULA = 'eula',
  SLA = 'sla',
  PARTNERSHIP_AGREEMENT = 'partnership_agreement',
  VENDOR_AGREEMENT = 'vendor_agreement',
  DATA_PROCESSING_ADDENDUM = 'data_processing_addendum',
  USER_AGREEMENT = 'user_agreement',
  SUBSCRIPTION_AGREEMENT = 'subscription_agreement',
  OTHER = 'other',
}

export enum LegalDocumentStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  ARCHIVED = 'archived',
}

export type LegalDocumentDocument = LegalDocument & Document;

@Schema({ timestamps: true, collection: 'legal_documents' })
export class LegalDocument {
  @Prop({ required: true })
  title: string;

  @Prop({
    required: true,
    enum: LegalDocumentType,
    type: String,
  })
  document_type: LegalDocumentType;

  @Prop({ type: Object, required: true })
  content: any[]; // This will store the richText content as a flexible object

  @Prop({ type: Number })
  version: number;

  @Prop({ required: true })
  effective_date: string; // Stored as string, consider Date type if needed

  @Prop({
    required: true,
    enum: LegalDocumentStatus,
    default: LegalDocumentStatus.DRAFT,
    type: String,
  })
  status: LegalDocumentStatus;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy: Types.ObjectId;
}

export const LegalDocumentSchema = SchemaFactory.createForClass(LegalDocument);
