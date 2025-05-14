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
  id: string; // The id of the user, campus, university, etc.

  @Prop({ type: Boolean, default: false })
  isRead: boolean; // Read status for this recipient
}

export const RecipientSchema = SchemaFactory.createForClass(Recipient);

export enum AudienceType {
  User = 'User', // User.name
  University = 'University', // University.name
  Campus = 'Campus', // Campus.name
}

@Schema({ _id: false })
export class Audience {
  @Prop({
    type: String,
    required: true,
    enum: [AudienceType.User, AudienceType.University, AudienceType.Campus],
  })
  audienceType: AudienceType;

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

const NotificationSchema = SchemaFactory.createForClass(Notification);

// Add custom validation for mutual exclusivity
NotificationSchema.pre('validate', function (next) {
  // @ts-ignore
  const doc = this as Notification;
  if (
    doc.audience.isGlobal &&
    doc.audience.recipients &&
    doc.audience.recipients.length > 0
  ) {
    return next(
      new Error('If isGlobal is true, recipients must be undefined or empty.'),
    );
  }
  if (
    !doc.audience.isGlobal &&
    (!doc.audience.recipients || doc.audience.recipients.length === 0)
  ) {
    return next(
      new Error(
        'If isGlobal is false, recipients must be provided and not empty.',
      ),
    );
  }
  next();
});

export { NotificationSchema };

