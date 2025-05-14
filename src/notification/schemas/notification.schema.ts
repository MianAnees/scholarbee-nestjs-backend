import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Campus } from 'src/campuses/schemas/campus.schema';
import { University } from 'src/universities/schemas/university.schema';
import { User } from 'src/users/schemas/user.schema';

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
  @Prop({ type: String, required: true, refPath: 'audience.audienceType' })
  recipientId: string; // The id of the user, campus, university, etc.

  @Prop({ type: Boolean, default: false })
  isRead: boolean; // Read status for this recipient
}

export const RecipientSchema = SchemaFactory.createForClass(Recipient);

@Schema({ _id: false })
export class Audience {
  @Prop({
    type: String,
    required: true,
    enum: [User.name, University.name, Campus.name],
  })
  audienceType: string;

  // ! For Global notifications, recipients is not present
  @Prop({ type: Boolean, required: true })
  isGlobal: boolean;

  @Prop({ type: [RecipientSchema], required: false })
  recipients?: Recipient[];
}

export const AudienceSchema = SchemaFactory.createForClass(Audience);

@Schema({ timestamps: { createdAt: 'createdAt', updatedAt: false } })
export class Notification {
  // @Prop({ type: String, required: true, enum: NotificationType })
  // type: NotificationType;

  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: String, required: true })
  message: string;

  @Prop({ type: AudienceSchema, required: true })
  audience: Audience;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

