import { IsOptional, IsString, IsNumber, IsMongoId } from 'class-validator';
import { Type } from 'class-transformer';

export class FilterAdmissionProgramDto {
    @IsOptional()
    @IsMongoId()
    _id?: string;

    @IsOptional()
    @IsString()
    major?: string;

    @IsOptional()
    @IsString()
    fee?: string;

    @IsOptional()
    @IsString()
    year?: string;

    @IsOptional()
    @IsString()
    intake?: string;

    @IsOptional()
    @IsString()
    programName?: string;

    @IsOptional()
    @IsString()
    university?: string;

    @IsOptional()
    @IsString()
    studyLevel?: string;

    @IsOptional()
    @IsString()
    courseForm?: string;

    @IsOptional()
    @IsString()
    campusId?: string;

    @IsOptional()
    @Type(() => Number)
    page?: number = 1;

    @IsOptional()
    @Type(() => Number)
    limit?: number = 10;
} 