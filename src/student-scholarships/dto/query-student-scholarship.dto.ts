import { IsEnum, IsMongoId, IsOptional, IsString, IsNumber } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { FatherLivingStatusEnum, LastDegreeLevelEnum, ScholarshipApprovalStatusEnum } from '../schemas/student-scholarship.schema';

export class QueryStudentScholarshipDto {
    @IsOptional()
    @IsMongoId()
    student_id?: string;

    @IsOptional()
    @IsMongoId()
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