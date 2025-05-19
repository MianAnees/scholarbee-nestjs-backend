import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: { createdAt: false, updatedAt: false } })
export class NotificationReadReceipt {
  @Prop({ type: String, required: true })
  id: string; // Unique identifier for the read receipt (optional, can use _id)

  @Prop({ type: Types.ObjectId, ref: 'Notification', required: true })
  notificationId: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: string;

  @Prop({ type: Date, required: true })
  readAt: Date;
}

export type NotificationReadReceiptDocument = NotificationReadReceipt &
  Document;
export const NotificationReadReceiptSchema = SchemaFactory.createForClass(
  NotificationReadReceipt,
);
