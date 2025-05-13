import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type NotificationDocument = Notification & Document;

// export enum NotificationType {
//   APPLICATION_REJECTED = 'application/rejected',
//   DEADLINE_PASSED = 'deadline/passed',
//   APPLICATION_ACCEPTED = 'application/accepted',
//   APPLICATION_SUBMITTED = 'application/submitted',
// }

// Embedded subdocument for each recipient (no _id field)
@Schema({ _id: false })
export class Recipient {
  @Prop({ type: String, required: true })
  recipientId: string; // The id of the user, campus, university, etc.

  @Prop({ type: Boolean, default: false })
  isRead: boolean; // Read status for this recipient
}

export const RecipientSchema = SchemaFactory.createForClass(Recipient);

@Schema({ timestamps: { createdAt: 'createdAt', updatedAt: false } })
export class Notification {
  // @Prop({ type: String, required: true, enum: NotificationType })
  // type: NotificationType;

  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: String, required: true })
  message: string;

  @Prop({
    type: {
      audienceType: { type: String, required: true }, // e.g., 'user', 'university', 'campus'
      isGlobal: { type: Boolean, required: true }, // true if for all of this type
      recipients: { type: [RecipientSchema], required: false }, // Only present if isGlobal is false
    },
    required: true,
  })
  audience: {
    audienceType: string;
    isGlobal: boolean;
    recipients?: Recipient[];
  };
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
