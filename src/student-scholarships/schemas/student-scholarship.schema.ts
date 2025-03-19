import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type StudentScholarshipDocument = StudentScholarship & Document;

@Schema({ timestamps: true })
export class StudentScholarship {
    @Prop({ type: String, required: true })
    scholarship_name: string;

    @Prop({ type: String, required: true })
    scholarship_description: string;

    @Prop({ type: String, enum: ['merit', 'need', 'local', 'international'], default: 'merit' })
    scholarship_type: string;

    @Prop({ type: Number, default: 0 })
    amount: number;

    @Prop({ type: Date, required: true })
    application_deadline: Date;

    @Prop({ type: String, required: false })
    application_link?: string;

    @Prop({ type: String, required: false })
    application_process?: string;

    @Prop({ type: String, required: true })
    eligibility_criteria: string;

    @Prop({ type: [Object], default: [] })
    required_documents: Array<{ id: string; document_name: string }>;

    @Prop({ type: String, enum: ['open', 'closed'], default: 'open' })
    status: string;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'University', required: true })
    university_id: MongooseSchema.Types.ObjectId;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Country', required: false })
    country?: MongooseSchema.Types.ObjectId;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Region', required: false })
    region?: MongooseSchema.Types.ObjectId;

    @Prop({ type: Date, default: Date.now })
    created_at: Date;

    @Prop({ type: String, required: true })
    createdBy: string;
}

export const StudentScholarshipSchema = SchemaFactory.createForClass(StudentScholarship); 