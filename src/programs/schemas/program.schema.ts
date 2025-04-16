import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ProgramDocument = Program & Document;

@Schema({ timestamps: true })
export class Program {
    @Prop({ type: String, required: true })
    name: string;

    @Prop({ type: String, required: false })
    major?: string;

    @Prop({ type: String, required: false })
    accreditations?: string;

    @Prop({ type: String, required: false })
    mode_of_study?: string;

    @Prop({ type: String, required: false })
    scholarship_options?: string;

    @Prop({ type: String, required: false })
    sorting_weight?: string;

    @Prop({ type: String, ref: 'Campus', required: true })
    campus_id: string;

    @Prop({ type: String, required: false })
    academic_departments?: string;

    @Prop({ type: String, required: false })
    academic_departments_id?: string;

    @Prop({ type: String, required: false })
    program_type_template?: string;

    @Prop({ type: String, required: false })
    programs_template?: string;

    @Prop({ type: Date, default: Date.now })
    created_at: Date;
}

export const ProgramSchema = SchemaFactory.createForClass(Program); 