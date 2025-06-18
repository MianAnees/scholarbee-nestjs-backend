import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CampusDocument = Campus & Document<Types.ObjectId>;

@Schema({
  timestamps: true,
  collection: 'campuses', // Explicitly set collection name
})
export class Campus {
  @Prop({ required: true })
  name: string;

  @Prop({ type: Types.ObjectId, ref: 'University' })
  university_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Address' })
  address_id: Types.ObjectId;

  @Prop()
  campus_type: string;

  @Prop()
  established_date: Date;

  @Prop()
  campus_area: number;

  @Prop()
  website: string;

  @Prop()
  contact_phone: string;

  @Prop()
  contact_email: string;

  @Prop()
  logo_url: string;

  @Prop()
  latitude: number;

  @Prop()
  longitude: number;

  @Prop()
  student_population: number;

  @Prop({ default: true })
  library_facilities: boolean;

  @Prop({ default: true })
  sports_facilities: boolean;

  @Prop({ default: true })
  dining_options: boolean;

  @Prop({ default: true })
  transportation_options: boolean;

  @Prop({ default: true })
  residential_facilities: boolean;

  @Prop({ default: true })
  healthcare_facilities: boolean;

  @Prop({ default: true })
  parking_facilities: boolean;

  @Prop({ default: true })
  security_features: boolean;

  @Prop()
  facilities: string;

  @Prop()
  accreditations: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy: Types.ObjectId;
}

export const CampusSchema = SchemaFactory.createForClass(Campus);
