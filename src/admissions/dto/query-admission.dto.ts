import { IsOptional, IsString, IsMongoId, IsDate, IsNumber, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryAdmissionDto {
    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsMongoId()
    university_id?: string;

    @IsOptional()
    @IsMongoId()
    campus_id?: string;

    @IsOptional()
    @IsDate()
    @Type(() => Date)
    admission_deadline_before?: Date;

    @IsOptional()
    @IsDate()
    @Type(() => Date)
    admission_deadline_after?: Date;

    @IsOptional()
    @IsDate()
    @Type(() => Date)
    admission_startdate_before?: Date;

    @IsOptional()
    @IsDate()
    @Type(() => Date)
    admission_startdate_after?: Date;

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