import { IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryRegionDto {
    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsString()
    region_name?: string;

    @IsOptional()
    @IsString()
    country?: string;

    @IsOptional()
    @IsString()
    city?: string;

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