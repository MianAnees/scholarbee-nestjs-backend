import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type FeeDocument = Fee & Document;

@Schema({ timestamps: true })
export class Fee {
    @Prop({ type: String, required: true })
    program_id: string;

    @Prop({ type: Number, required: true })
    tuition_fee: number;

    @Prop({ type: Number, required: false })
    application_fee?: number;

    @Prop({ type: String, required: false })
    other_fees?: string;

    @Prop({ type: String, required: false })
    payment_schedule?: string;

    @Prop({ type: Date, default: Date.now })
    created_at: Date;
}

export const FeeSchema = SchemaFactory.createForClass(Fee); 