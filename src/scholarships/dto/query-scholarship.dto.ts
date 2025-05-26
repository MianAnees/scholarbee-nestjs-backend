import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';
import {
  DegreeLevelEnum,
  ScholarshipLocationEnum,
  ScholarshipStatusEnum,
  ScholarshipTypeEnum,
} from 'src/common/constants/shared.constants';

export class QueryScholarshipDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  scholarship_name?: string;

  @IsOptional()
  @IsEnum(ScholarshipTypeEnum)
  scholarship_type?: ScholarshipTypeEnum;

  @IsOptional()
  @IsEnum(DegreeLevelEnum)
  degree_level?: DegreeLevelEnum;

  @IsOptional()
  @IsEnum(ScholarshipLocationEnum)
  location?: ScholarshipLocationEnum;

  @IsOptional()
  @IsString()
  campus_id?: string;

  @IsOptional()
  @IsString()
  major?: string;

  @IsOptional()
  @IsString()
  university_id?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @IsEnum(ScholarshipStatusEnum)
  status?: ScholarshipStatusEnum;

  @IsOptional()
  @Type(() => Date)
  start_date?: Date;

  @IsOptional()
  @Type(() => Date)
  end_date?: Date;

  @IsOptional()
  @Type(() => Date)
  deadlineFrom?: Date;

  @IsOptional()
  @Type(() => Date)
  deadlineTo?: Date;

  @IsOptional()
  @Type(() => Number)
  amountMin?: number;

  @IsOptional()
  @Type(() => Number)
  amountMax?: number;

  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  sortBy?: string = 'created_at';

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';

  @IsOptional()
  @Type(() => Boolean)
  populate?: boolean = true;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  favouriteBy?: string[];
}
