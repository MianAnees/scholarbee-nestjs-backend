import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { LegalDocument } from 'src/legal-documents/schemas/legal-document.schema';

export type LegalDocumentRequirementDocument = LegalDocumentRequirement &
  Document;

export enum LegalActionType {
  STUDENT_PROGRAM_APPLICATION = 'student_program_application',
  ADMIN_CREATE_SCHOLARSHIP = 'admin_create_scholarship',
  USER_REGISTRATION = 'user_registration',
  CAMPUS_REGISTRATION = 'campus_registration',
  UNIVERSITY_REGISTRATION = 'university_registration',
  OTHER = 'other',
}

interface ILegalDocumentRequirement {
  // What user wants to achieve
  applicable_on: LegalActionType;
  // Should be an array of LegalDocument IDs Only referencing the legal documents
  required_documents: Types.ObjectId[];
  // Optional description of why these documents are required
  description?: string;
}

@Schema({ timestamps: true, collection: 'legal_document_requirements' })
export class LegalDocumentRequirement implements ILegalDocumentRequirement {
  @Prop({ required: true, enum: LegalActionType, unique: true })
  applicable_on: LegalActionType;

  @Prop({
    type: [Types.ObjectId],
    required: true,
    ref: LegalDocument.name,
  })
  required_documents: Types.ObjectId[]; // Array of document types required

  @Prop()
  description?: string; // Optional description of why these documents are required
}

export const LegalDocumentRequirementSchema = SchemaFactory.createForClass(
  LegalDocumentRequirement,
);
