import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: { createdAt: false, updatedAt: false } })
export class NotificationReadReceipt {
  @Prop({ type: Types.ObjectId, ref: 'Notification', required: true })
  notificationId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Date, required: true })
  readAt: Date;
}

export type NotificationReadReceiptDocument = NotificationReadReceipt &
  Document;
export const NotificationReadReceiptSchema = SchemaFactory.createForClass(
  NotificationReadReceipt,
);

// Create a unique index on notificationId and userId to prevent duplicate read receipts for the same notification and user
NotificationReadReceiptSchema.index(
  { notificationId: 1, userId: 1 },
  { unique: true },
);
