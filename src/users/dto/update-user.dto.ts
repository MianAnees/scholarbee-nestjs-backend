import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsOptional,
  IsString,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  date_of_birth?: Date;

  @IsOptional()
  @IsString()
  father_name?: string;

  @IsOptional()
  @IsString()
  father_profession?: string;

  @IsOptional()
  @IsEnum(['alive', 'deceased'])
  father_status?: string;

  @IsOptional()
  @IsString()
  father_income?: string;

  @IsOptional()
  @IsString()
  mother_name?: string;

  @IsOptional()
  @IsString()
  mother_profession?: string;

  @IsOptional()
  @IsEnum(['alive', 'deceased'])
  mother_status?: string;

  @IsOptional()
  @IsString()
  mother_income?: string;

  @IsOptional()
  @IsString()
  religion?: string;

  @IsOptional()
  @IsEnum(['yes', 'no'])
  special_person?: string;

  @IsOptional()
  @IsEnum(['Male', 'Female', 'Other'])
  gender?: string;

  @IsOptional()
  @IsString()
  nationality?: string;

  @IsOptional()
  @IsString()
  fatherEmailAddress?: string;

  @IsOptional()
  @IsString()
  fatherPhoneNumber?: string;

  @IsOptional()
  @IsEnum(['khyber_pakhtunkhwa', 'punjab', 'sindh', 'balochistan'])
  provinceOfDomicile?: string;

  @IsOptional()
  @IsString()
  districtOfDomicile?: string;

  @IsOptional()
  @IsString()
  stateOrProvince?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  postalCode?: string;

  @IsOptional()
  @IsString()
  streetAddress?: string;

  @IsOptional()
  @IsString()
  profile_image_url?: string;

  @IsOptional()
  @IsBoolean()
  isProfileCompleted?: boolean;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  current_stage?: number;
}
