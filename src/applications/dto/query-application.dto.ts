import { IsOptional, IsString, IsMongoId, IsDate, IsEnum, IsNumber, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryApplicationDto {
    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsMongoId()
    applicant?: string;

    @IsOptional()
    @IsMongoId()
    admission_program_id?: string;

    @IsOptional()
    @IsMongoId()
    campus_id?: string;

    @IsOptional()
    @IsMongoId()
    program?: string;

    @IsOptional()
    @IsMongoId()
    student_id?: string;

    @IsOptional()
    @IsMongoId()
    program_id?: string;

    @IsOptional()
    @IsMongoId()
    admission_id?: string;

    @IsOptional()
    @IsMongoId()
    applicant_id?: string;

    @IsOptional()
    @IsEnum(['draft', 'submitted', 'under_review', 'approved', 'rejected'])
    status?: string;

    @IsOptional()
    @IsDate()
    @Type(() => Date)
    submissionDateFrom?: Date;

    @IsOptional()
    @IsDate()
    @Type(() => Date)
    submissionDateTo?: Date;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    page?: number = 1;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    limit?: number = 10;

    @IsOptional()
    @IsString()
    sortBy?: string = 'createdAt';

    @IsOptional()
    @IsString()
    sortOrder?: 'asc' | 'desc' = 'desc';

    @IsOptional()
    @IsBoolean()
    @Type(() => Boolean)
    populate?: boolean = true;
} 