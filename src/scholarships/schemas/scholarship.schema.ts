import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import {
  DegreeLevelEnum,
  ScholarshipLocationEnum,
  ScholarshipStatusEnum,
  ScholarshipTypeEnum,
} from 'src/common/constants/shared.constants';

export type ScholarshipDocument = Scholarship & Document;

interface RequiredDocument {
  id: string;
  document_name: string;
  // TODO: Add `is_optional` as an optional field to support optional documents
}

@Schema({ timestamps: true, collection: 'scholarships' })
export class Scholarship {
  @Prop({ type: String, required: true })
  scholarship_name: string;

  @Prop({ type: String, required: true })
  scholarship_description: string;

  @Prop({
    type: String,
    enum: ScholarshipTypeEnum,
    default: ScholarshipTypeEnum.Merit,
  })
  scholarship_type: ScholarshipTypeEnum;

  @Prop({
    type: String,
    enum: ScholarshipLocationEnum,
    default: ScholarshipLocationEnum.Local,
  })
  location: ScholarshipLocationEnum;

  @Prop({ type: Date, required: true })
  application_opening_date: Date;

  @Prop({ type: String, enum: DegreeLevelEnum, required: true })
  degree_level: DegreeLevelEnum;

  @Prop({ type: Number, default: 0 })
  amount: number;

  @Prop({ type: Date, required: true })
  application_deadline: Date;

  @Prop({ type: String })
  application_link?: string;

  @Prop({ type: String })
  application_process?: string;

  @Prop({ type: String, required: false })
  eligibility_criteria: string;

  @Prop({ type: [Object], default: [], required: false })
  required_documents: RequiredDocument[];

  @Prop({
    type: String,
    enum: ScholarshipStatusEnum,
    default: ScholarshipStatusEnum.Open,
  })
  status: ScholarshipStatusEnum;

  @Prop({ type: [MongooseSchema.Types.ObjectId], ref: 'Campus', default: [] })
  campus_ids: MongooseSchema.Types.ObjectId[];

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'University',
    required: false,
  })
  university_id: MongooseSchema.Types.ObjectId;

  @Prop({ type: Number, default: 0, required: false })
  rating?: number;

  @Prop({ type: String, required: false })
  major?: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Region' })
  region?: MongooseSchema.Types.ObjectId;

  @Prop({ type: String })
  image_url?: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  })
  organization_id: MongooseSchema.Types.ObjectId;

  @Prop({ type: String, required: true })
  createdBy: string;

  @Prop({ type: Date, default: Date.now })
  created_at: Date;

  @Prop({ type: [String], default: [] })
  favouriteBy: string[];
}

export const ScholarshipSchema = SchemaFactory.createForClass(Scholarship);
