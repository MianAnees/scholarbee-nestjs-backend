import { IsNotEmpty, IsOptional, IsString, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProgramDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    major?: string;

    @IsString()
    @IsOptional()
    accreditations?: string;

    @IsString()
    @IsOptional()
    mode_of_study?: string;

    @IsString()
    @IsOptional()
    scholarship_options?: string;

    @IsString()
    @IsOptional()
    sorting_weight?: string;

    @IsString()
    @IsNotEmpty()
    campus_id: string;

    @IsString()
    @IsOptional()
    academic_departments?: string;

    @IsString()
    @IsOptional()
    academic_departments_id?: string;

    @IsString()
    @IsOptional()
    program_type_template?: string;

    @IsString()
    @IsOptional()
    programs_template?: string;

    @IsDate()
    @IsOptional()
    @Type(() => Date)
    created_at?: Date;
} 