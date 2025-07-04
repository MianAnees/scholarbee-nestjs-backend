import { IsEnum, IsMongoId, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryOrganizationDto {
    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsString()
    organization_name?: string;

    @IsOptional()
    @IsEnum(['government', 'private', 'university'])
    organization_type?: string;

    @IsOptional()
    @IsString()
    address?: string;

    @IsOptional()
    @IsString()
    contact_email?: string;

    @IsOptional()
    @IsString()
    contact_phone?: string;

    @IsOptional()
    @IsString()
    website_url?: string;

    @IsOptional()
    @IsMongoId()
    country?: string;

    @IsOptional()
    @IsMongoId()
    region?: string;

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