import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type MessageDocument = Message & Document;

@Schema({ timestamps: true })
export class Message {
    _id?: Types.ObjectId;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Conversation', required: true })
    conversation_id: Types.ObjectId;

    @Prop({ type: MongooseSchema.Types.ObjectId, required: true })
    sender_id: Types.ObjectId;

    @Prop({ type: String, enum: ['user', 'campus'], required: true })
    sender_type: string;

    @Prop({ type: String, enum: ['User', 'Campus'], required: true })
    sender_type_ref: string;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
    replied_by_user_id: Types.ObjectId;

    @Prop({ type: MongooseSchema.Types.Mixed })
    replied_by_user: any;

    @Prop({ required: true })
    content: string;

    @Prop({ default: false })
    is_read_by_user: boolean;

    @Prop({ default: false })
    is_read_by_campus: boolean;

    @Prop({ type: [String], default: [] })
    attachments: string[];

    @Prop({ default: new Date() })
    created_at: Date;

    @Prop({ type: MongooseSchema.Types.Mixed })
    sender: any;

    @Prop({ type: Number, default: 0 })
    sessionId: number;
}

export const MessageSchema = SchemaFactory.createForClass(Message); 