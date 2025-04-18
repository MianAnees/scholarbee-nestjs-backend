import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type OrganizationDocument = Organization & Document;

@Schema({ timestamps: true })
export class Organization {
    @Prop({ type: String, required: true })
    organization_name: string;

    @Prop({ type: String, required: true, enum: ['government', 'private', 'university'] })
    organization_type: string;

    @Prop({ type: String, required: false })
    address?: string;

    @Prop({ type: String, required: false })
    contact_email?: string;

    @Prop({ type: String, required: false })
    contact_phone?: string;

    @Prop({ type: String, required: false })
    website_url?: string;

    @Prop({ type: String, required: false })
    profile_image_url?: string;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Country', required: false })
    country?: MongooseSchema.Types.ObjectId;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Region', required: false })
    region?: MongooseSchema.Types.ObjectId;
}

export const OrganizationSchema = SchemaFactory.createForClass(Organization); 