import { IsArray, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryProgramTemplateDto {
    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    slug?: string;

    @IsOptional()
    @IsString()
    group?: string;

    @IsOptional()
    @IsString()
    tag?: string;

    @IsOptional()
    @IsString()
    createdBy?: string;

    @IsOptional()
    @Type(() => Date)
    createdAtFrom?: Date;

    @IsOptional()
    @Type(() => Date)
    createdAtTo?: Date;

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
} 