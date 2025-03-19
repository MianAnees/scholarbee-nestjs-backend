import { IsOptional, IsString, IsNumber, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryFeeDto {
    @IsOptional()
    @IsString()
    program_id?: string;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    minTuitionFee?: number;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    maxTuitionFee?: number;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    minApplicationFee?: number;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    maxApplicationFee?: number;

    @IsOptional()
    @IsString()
    payment_schedule?: string;

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
    @IsString()
    search?: string;
} 