import {
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';
import { IsObjectId } from 'src/common/validators/object-id.validator';

export class CreateNotificationDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  title: string;

  @IsString()
  @IsNotEmpty()
  message: string;
}

// DTO for global notification creation
export class CreateGlobalNotificationDto extends CreateNotificationDto {}

// DTO for specific users notification creation
export class CreateSpecificNotificationDto extends CreateNotificationDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  userIds: string[];
}

// DTO for marking notifications as read
export class MarkBulkNotificationsAsReadDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @IsObjectId({
    each: true,
    message: 'Each notification ID must be a valid MongoDB ObjectId',
  })
  notificationIds: string[];
}

// DTO for validating notificationId as a param
export class MarkNotificationAsReadDto {
  @IsString()
  @IsNotEmpty()
  @IsObjectId({ message: 'Notification ID must be a valid MongoDB ObjectId' })
  notificationId: string;
}

// DTO for creating a campus global notification
export class CreateCampusGlobalNotificationDto extends CreateNotificationDto {
  // @IsObjectId({ message: 'Campus ID must be a valid MongoDB ObjectId' })
  // @IsNotEmpty()
  // campusId: string;
}

// DTO for creating a notification for specific campuses
export class CreateCampusSpecificNotificationsDto extends CreateNotificationDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsObjectId({
    each: true,
    message: 'Each campus ID must be a valid MongoDB ObjectId',
  })
  campusIds: string[];
}
