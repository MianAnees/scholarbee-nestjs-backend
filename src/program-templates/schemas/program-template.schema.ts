import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ProgramTemplateDocument = ProgramTemplate & Document;

@Schema({ timestamps: true })
export class ProgramTemplate {
    @Prop({ type: String, required: true })
    name: string;

    @Prop({ type: String, required: true, unique: true })
    slug: string;

    @Prop({ type: String, required: false })
    description?: string;

    @Prop({ type: String, required: false })
    group?: string;

    @Prop({ type: [Object], default: [] })
    tags: Array<{ id: string; tag: string }>;

    @Prop({ type: Date, default: Date.now })
    created_at: Date;

    @Prop({ type: Date, default: Date.now })
    updated_at: Date;

    @Prop({ type: String, required: true })
    createdBy: string;
}

export const ProgramTemplateSchema = SchemaFactory.createForClass(ProgramTemplate); 