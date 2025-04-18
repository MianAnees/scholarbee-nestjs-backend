import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true })
export class Admission extends Document {
    @Prop({
        type: [{
            id: { type: String, required: true },
            key: { type: String, required: true },
            value: { type: String, required: true }
        }]
    })
    admission_announcements: Array<{
        id: string;
        key: string;
        value: string;
    }>;

    @Prop({ type: Date, required: true })
    admission_deadline: Date;

    @Prop({ type: String })
    admission_description: string;

    @Prop({ type: Date })
    admission_startdate: Date;

    @Prop({ type: String, required: true })
    admission_title: string;

    @Prop({ type: Number })
    available_seats: number;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Campus', required: true })
    campus_id: string;

    @Prop({ type: Date })
    created_at: Date;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
    createdBy: string;

    @Prop({ type: String })
    poster: string;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'University', required: true })
    university_id: string;
}

export const AdmissionSchema = SchemaFactory.createForClass(Admission); 