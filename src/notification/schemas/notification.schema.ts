import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type NotificationDocument = Notification & Document;

export enum NotificationType {
  APPLICATION_REJECTED = 'application/rejected',
  DEADLINE_PASSED = 'deadline/passed',
  APPLICATION_ACCEPTED = 'application/accepted',
  APPLICATION_SUBMITTED = 'application/submitted',
}

@Schema({ timestamps: { createdAt: 'createdAt', updatedAt: false } })
export class Notification {
  @Prop({ type: [String], required: true })
  userIds: string[];

  @Prop({ type: String, required: true, enum: NotificationType })
  type: NotificationType;

  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: String, required: true })
  message: string;

  @Prop({ type: Boolean, default: false })
  seen: boolean;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
