import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type AdmissionProgramDocument = AdmissionProgram & Document;

interface AdmissionRequirementValue {
    children: Array<{
        bold?: boolean;
        italic?: boolean;
        underline?: boolean;
        text?: string;
        type?: string;
        children?: any[];
        url?: string;
        newTab?: boolean;
        code?: boolean;
    }>;
    type?: string;
}

interface AdmissionRequirement {
    id: string;
    key: string;
    value: AdmissionRequirementValue[];
}

@Schema({ timestamps: true, collection: 'admission_programs' })
export class AdmissionProgram {
    @Prop({ type: String, ref: 'Admission' })
    admission: string;

    @Prop({ type: String })
    admission_fee: string;

    @Prop({
        type: [{
            id: { type: String, required: true },
            key: { type: String, required: true },
            value: { type: Array, required: true }
        }]
    })
    admission_requirements: AdmissionRequirement[];

    @Prop({ type: Number, required: true })
    available_seats: number;

    @Prop({ type: Date })
    created_at: Date;

    @Prop({ type: String, ref: 'User' })
    createdBy: string;

    @Prop({ type: [String], default: [] })
    favouriteBy: string[];

    @Prop({ type: String, ref: 'Program', required: true })
    program: string;

    @Prop({ type: String })
    redirect_deeplink: string;
}

export const AdmissionProgramSchema = SchemaFactory.createForClass(AdmissionProgram); 