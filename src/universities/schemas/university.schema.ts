import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type UniversityDocument = University & Document;

@Schema({
    timestamps: true,
    collection: 'universities' // Explicitly set collection name
})
export class University {
    @Prop({ required: true })
    name: string;

    @Prop()
    founded: Date;

    @Prop()
    description: string;

    @Prop({ type: Types.ObjectId, ref: 'Address' })
    address_id: Types.ObjectId;

    @Prop()
    website: string;

    @Prop()
    ranking: string;

    @Prop()
    affiliations: string;

    @Prop()
    motto: string;

    @Prop()
    colors: string;

    @Prop()
    mascot: string;

    @Prop()
    type: string;

    @Prop()
    total_students: number;

    @Prop()
    total_faculty: number;

    @Prop()
    total_alumni: number;

    @Prop()
    endowment: string;

    @Prop()
    campus_size: string;

    @Prop()
    annual_budget: number;

    @Prop()
    research_output: number;

    @Prop()
    international_students: number;

    @Prop()
    languages: string;

    @Prop()
    logo_url: string;

    @Prop()
    accreditations: string;

    @Prop()
    notable_alumni: string;

    @Prop({ type: Boolean, default: false })
    has_programs: boolean;

    @Prop({ type: Types.ObjectId, ref: 'User' })
    createdBy: Types.ObjectId;
}

export const UniversitySchema = SchemaFactory.createForClass(University); 