import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Campus } from '../../campuses/schemas/campus.schema';

export type ContactDocument = Contact & Document;

@Schema({ timestamps: true })
export class Contact {
    @Prop({ type: String, required: true })
    name: string;

    @Prop({ type: String, required: true })
    email: string;

    @Prop({ type: String, required: true })
    phone: string;

    @Prop({ type: String, enum: ['registration', 'general'], default: 'registration' })
    type: string;

    @Prop({ type: Boolean, default: true })
    is_scholarship: boolean;

    @Prop({ type: String, default: '' })
    message: string;

    @Prop({ type: String, enum: ['Male', 'Female', 'Other'], required: false })
    gender?: string;

    @Prop({ type: String, required: false })
    study_level?: string;

    @Prop({ type: String, required: false })
    study_country?: string;

    @Prop({ type: String, required: false })
    study_city?: string;

    @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Campus' }], default: [] })
    campusesIds?: MongooseSchema.Types.ObjectId[];

    @Prop({ type: String, required: true })
    user_type: string;

    @Prop({ type: Date })
    created_at: Date;
}

export const ContactSchema = SchemaFactory.createForClass(Contact); 