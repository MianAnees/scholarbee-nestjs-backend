import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type RegionDocument = Region & Document;

@Schema({ timestamps: true })
export class Region {
    @Prop({ type: String, required: true })
    region_name: string;

    @Prop({ type: String, required: true })
    country: string;

    @Prop({ type: [String], default: [] })
    cities: string[];
}

export const RegionSchema = SchemaFactory.createForClass(Region); 