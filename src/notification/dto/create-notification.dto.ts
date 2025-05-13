import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsBoolean,
  ValidateNested,
  IsArray,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

export class RecipientDto {
  @IsString()
  @IsNotEmpty()
  recipientId: string;

  @IsBoolean()
  @IsOptional()
  isRead?: boolean;
}

export class AudienceDto {
  // TODO: Ensure that the audienceType is one of the allowed values i.e. the real collection names in the database e.g. University.name, Campus.name, User.name
  @IsString()
  @IsNotEmpty()
  audienceType: string; // e.g., 'user', 'university', 'campus'

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

  @ValidateNested()
  @Type(() => AudienceDto)
  audience: AudienceDto;
}
