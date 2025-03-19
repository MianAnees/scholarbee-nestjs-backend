import { IsOptional, IsString, IsMongoId, IsNumber, IsBoolean, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryAdmissionProgramDto {
    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsMongoId()
    admission?: string;

    @IsOptional()
    @IsMongoId()
    program?: string;

    @IsOptional()
    @IsArray()
    @IsMongoId({ each: true })
    favouriteBy?: string[];

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    minAvailableSeats?: number;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    maxAvailableSeats?: number;

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