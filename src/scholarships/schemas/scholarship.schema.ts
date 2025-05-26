import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

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
    enum: ['merit', 'need'],
    default: 'merit',
  })
  scholarship_type: string;

  @Prop({
    type: String,
    enum: ['local', 'international'],
    default: 'local',
  })
  location: string;

  // TODO: `application_opening_date` to be added as a specific date
  @Prop({ type: Date, required: true })
  application_opening_date: Date;

  // TODO: Degree_Level to be added

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

  @Prop({ type: String, enum: ['open', 'closed'], default: 'open' })
  status: string;

  // TODO: Add Campus_ids (multiple) as an optional field

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'University',
    // required: true,
  })
  university_id: MongooseSchema.Types.ObjectId;

  // @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Country' })
  // country?: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Region' })
  region?: MongooseSchema.Types.ObjectId;

  @Prop({ type: String })
  image_url?: string;

  // @Prop({ type: String, required: true })
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
