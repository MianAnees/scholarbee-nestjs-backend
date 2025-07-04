import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type ConversationDocument = Conversation & Document<Types.ObjectId>;

export enum ConversationParticipantType {
  USER = 'user',
  CAMPUS = 'campus',
}

@Schema({ timestamps: true })
export class Conversation {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  user_id: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Campus', required: true })
  campus_id: Types.ObjectId;

  @Prop({ default: new Date() })
  last_message_time: Date;

  @Prop({ default: false })
  is_read_by_user: boolean;

  @Prop({ default: false })
  is_read_by_campus: boolean;

  @Prop({ default: true })
  is_active: boolean;

  @Prop()
  last_message: string;

  @Prop({
    type: String,
    enum: ConversationParticipantType,
    default: ConversationParticipantType.USER,
  })
  last_message_sender: ConversationParticipantType;

  @Prop({ type: Number, default: 0 })
  avgResponseTime: number;

  @Prop({ type: Number, default: 0 })
  sessionsCount: number;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);
// Add a compound index to ensure uniqueness between user and campus
ConversationSchema.index({ user_id: 1, campus_id: 1 }, { unique: true });
