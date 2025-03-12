import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AddressDocument = Address & Document;

@Schema()
export class Address {
    @Prop({ required: true })
    address_line_1: string;

    @Prop()
    address_line_2?: string;

    @Prop({ required: true })
    city: string;

    @Prop({ required: true })
    state: string;

    @Prop({ required: true })
    postal_code: string;

    @Prop({ required: true, type: Number })
    latitude: number;

    @Prop({ required: true, type: Number })
    longitude: number;

    @Prop({ type: Types.ObjectId })
    createdBy: Types.ObjectId;

    @Prop()
    createdAt: Date;

    @Prop()
    updatedAt: Date;
}

export const AddressSchema = SchemaFactory.createForClass(Address); 