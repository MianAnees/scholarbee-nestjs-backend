import { IsOptional, IsString, IsNumber, IsBoolean, IsArray } from 'class-validator';
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
    university_id?: string;

    @IsOptional()
    @IsString()
    campus_id?: string;

    /** This will be used to filter based on multiple campus_id fields */
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    campus_ids?: string[];

    @IsOptional()
    @IsString()
    degree_level?: string;

    @IsOptional()
    @IsString()
    academic_departments?: string;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    page?: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    limit?: number = 10;

    @IsOptional()
    @IsString()
    sortBy?: string = 'createdAt';

    @IsOptional()
    @IsString()
    sortOrder?: 'asc' | 'desc' = 'desc';

    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean()
    populate?: boolean = true;
} 