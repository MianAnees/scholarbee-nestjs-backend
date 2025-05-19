import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Types } from 'mongoose';
import { ToObjectId } from 'src/common/transformers/object-id.transformer';
import { IsObjectId } from 'src/common/validators/object-id.validator';
import { AudienceType } from '../schemas/notification.schema';
import { NotificationAudience } from './notification.validator';

export class RecipientDto {
  @IsObjectId()
  @ToObjectId()
  @IsNotEmpty()
  id: Types.ObjectId;

  @IsBoolean()
  @IsOptional()
  isRead?: boolean = false;
}

export class AudienceDto implements NotificationAudience {
  // TODO: Ensure that the audienceType is one of the allowed values i.e. the real collection names in the database e.g. University.name, Campus.name, User.name
  @IsString()
  @IsNotEmpty()
  @IsEnum(AudienceType)
  audienceType: AudienceType;

  @IsBoolean()
  isGlobal: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecipientDto)
  @IsOptional()
  recipients?: RecipientDto[];
}

export class CreateNotificationDto {
  // type is currently disabled in the schema
  // @IsString()
  // @IsNotEmpty()
  // type: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  title: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  // @IsAudienceMutuallyExclusive()
  // @ValidateNested()
  // @IsObject()
  // @IsNotEmpty()
  // @Type(() => AudienceDto)
  // audience: AudienceDto;
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