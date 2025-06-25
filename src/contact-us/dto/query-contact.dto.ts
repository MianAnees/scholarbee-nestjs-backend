import { IsOptional, IsString, IsBoolean, IsEnum, IsArray, IsDate, IsNumber, IsMongoId } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryContactDto {
    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsString()
    email?: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsOptional()
    @IsEnum(['registration', 'general'])
    type?: string;

    @IsOptional()
    @IsBoolean()
    @Type(() => Boolean)
    is_scholarship?: boolean;

    @IsOptional()
    @IsString()
    study_level?: string;

    @IsOptional()
    @IsString()
    study_country?: string;

    @IsOptional()
    @IsString()
    study_city?: string;

    @IsOptional()
    @IsArray()
    @IsMongoId({ each: true })
    campusesIds?: string[];

    @IsOptional()
    @IsEnum(['Student', 'Admin'])
    user_type?: string;

    @IsOptional()
    @IsDate()
    @Type(() => Date)
    createdAtFrom?: Date;

    @IsOptional()
    @IsDate()
    @Type(() => Date)
    createdAtTo?: Date;

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