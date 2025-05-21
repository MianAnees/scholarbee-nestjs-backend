import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

// export enum NotificationType {
//   APPLICATION_REJECTED = 'application/rejected',
//   DEADLINE_PASSED = 'deadline/passed',
//   APPLICATION_ACCEPTED = 'application/accepted',
//   APPLICATION_SUBMITTED = 'application/submitted',
// }

// Embedded subdocument for each recipient (no _id field)
// @Schema({ _id: false })
// export class Recipient {
//   @Prop({ type: String, required: true, refPath: 'audience.audienceType' })
//   id: string; // The id of the user, campus, university, etc.
//
//   @Prop({ type: Boolean, default: false })
//   isRead: boolean; // Read status for this recipient
// }
//
// export const RecipientSchema = SchemaFactory.createForClass(Recipient);

export enum AudienceType {
  User = 'User', // User.name
  University = 'University', // University.name
  Campus = 'Campus', // Campus.name
}

@Schema({ _id: false })
class Audience {
  @Prop({
    type: String,
    required: true,
    enum: [AudienceType.User, AudienceType.University, AudienceType.Campus],
  })
  audienceType: AudienceType;

  // ! For Global notifications, recipients is not present
  @Prop({ type: Boolean, required: true })
  isGlobal: boolean;

  @Prop({
    type: [{ type: Types.ObjectId, refPath: 'audienceType' }],
    required: function (this: Audience) {
      return !this.isGlobal;
    },
    // minlength: 1,
  })
  recipients?: Types.ObjectId[];
}

const AudienceSchema = SchemaFactory.createForClass(Audience);

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

const NotificationSchema = SchemaFactory.createForClass(Notification);

type NotificationDocument = Notification & Document;

export { NotificationSchema, type NotificationDocument };

