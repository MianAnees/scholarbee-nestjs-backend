import { IsEnum, IsMongoId, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryStudentScholarshipDto {
    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsString()
    scholarship_name?: string;

    @IsOptional()
    @IsEnum(['merit', 'need', 'local', 'international'])
    scholarship_type?: string;

    @IsOptional()
    @IsMongoId()
    university_id?: string;

    @IsOptional()
    @IsMongoId()
    country?: string;

    @IsOptional()
    @IsMongoId()
    region?: string;

    @IsOptional()
    @IsEnum(['open', 'closed'])
    status?: string;

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
    sortBy?: string = 'createdAt';

    @IsOptional()
    @IsString()
    sortOrder?: 'asc' | 'desc' = 'desc';

    @IsOptional()
    @Type(() => Boolean)
    populate?: boolean = true;
} 