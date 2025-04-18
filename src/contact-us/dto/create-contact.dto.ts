import { IsArray, IsBoolean, IsEmail, IsEnum, IsMongoId, IsOptional, IsString } from 'class-validator';

export class CreateContactDto {
    @IsString()
    name: string;

    @IsEmail()
    email: string;

    @IsString()
    phone: string;

    @IsEnum(['registration', 'general'])
    type: string;

    @IsBoolean()
    is_scholarship: boolean;

    @IsOptional()
    @IsString()
    message?: string;

    @IsOptional()
    @IsEnum(['Male', 'Female', 'Other'])
    gender?: string;

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

    @IsString()
    @IsEnum(['Student', 'Admin'])
    user_type: string;
} 