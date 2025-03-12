import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAcademicDepartmentDto {
    @IsNotEmpty()
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    campus_id?: string;

    @IsOptional()
    @IsString()
    contact_phone?: string;

    @IsOptional()
    @IsString()
    contact_email?: string;

    @IsOptional()
    @IsString()
    head_of_department?: string;
} 