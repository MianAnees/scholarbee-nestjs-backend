import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type LegalDocumentDocument = LegalDocument & Document;

@Schema({ timestamps: true })
export class LegalDocument {
  @Prop({ required: true })
  title: string;

  @Prop({
    required: true,
    enum: [
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
    ],
  })
  document_type: string;

  @Prop({ type: Object, required: true })
  content: any[]; // This will store the richText content as a flexible object

  @Prop({ type: Number })
  version: number;

  @Prop({ required: true })
  effective_date: string; // Stored as string, consider Date type if needed

  @Prop({
    required: true,
    enum: ['draft', 'active', 'archived'],
    default: 'draft',
  })
  status: 'draft' | 'active' | 'archived';

  @Prop({ type: Types.ObjectId, ref: 'User' }) // Assuming 'User' is the name of your User model
  createdBy: Types.ObjectId;

  // Timestamps are handled by the @Schema({ timestamps: true }) decorator
  // createdAt: string;
  // updatedAt: string;
}

export const LegalDocumentSchema = SchemaFactory.createForClass(LegalDocument);
