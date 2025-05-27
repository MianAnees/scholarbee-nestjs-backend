import { Type } from 'class-transformer';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ParseObjectId } from 'nestjs-object-id';
import { ScholarshipApprovalStatusEnum } from '../schemas/student-scholarship.schema';
import { FatherLivingStatusEnum } from 'src/common/constants/shared.constants';

export class QueryStudentScholarshipDto {
  @IsOptional()
  @ParseObjectId()
  student_id?: string;

  @IsOptional()
  @ParseObjectId()
  scholarship_id?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(FatherLivingStatusEnum)
  father_status?: FatherLivingStatusEnum;

  @IsOptional()
  @IsEnum(ScholarshipApprovalStatusEnum)
  approval_status?: ScholarshipApprovalStatusEnum;

  // REVIEW: These DTOs must be refactored into a reusable decorator
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
}
