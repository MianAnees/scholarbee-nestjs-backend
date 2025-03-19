import { IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryProgramDto {
    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    major?: string;

    @IsOptional()
    @IsString()
    mode_of_study?: string;

    @IsOptional()
    @IsString()
    campus_id?: string;

    @IsOptional()
    @IsString()
    academic_departments?: string;

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