import { IsString, IsNotEmpty, IsIn, MaxLength, IsEnum } from 'class-validator';
import { NotificationType } from '../schemas/notification.schema';

// the scope will be used to populate the userIds field in the notification document. It will not be stored as is.
enum NotificationScope {
  ALL = 'all', // will be sent to all users
  CAMPUS_ADMINS = 'campus_admins', // will be sent to campus admins
  SUPER_ADMINS = 'super_admins', // will be sent to super admins
  STUDENTS = 'students', // will be sent to students
}

export class CreateNotificationDto {
  @IsString()
  @IsNotEmpty()
  @IsEnum(NotificationScope)
  scope: string;

  @IsString()
  @IsNotEmpty()
  @IsEnum(NotificationType)
  type: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  title: string;

  @IsString()
  @IsNotEmpty()
  message: string;
}
