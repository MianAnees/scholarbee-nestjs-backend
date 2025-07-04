import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
} from 'class-validator';
import { IsValidBoolean } from 'src/auth/decorators/is-valid-boolean.decorator';

export class CreateContactDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  phone: string;

  @IsEnum(['registration', 'general'])
  type: string;

  @IsOptional()
  @IsValidBoolean()
  is_scholarship?: boolean;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsEnum(['Male', 'Female', 'Other'])
  gender?: string;

  @IsOptional()
  @IsString()
  study_level?: string;

  @IsOptional()
  @IsString()
  study_country?: string;

  @IsOptional()
  @IsString()
  study_city?: string;

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  campusesIds?: string[];

  @IsString()
  @IsEnum(['Student', 'Admin'])
  user_type: string;
}
