import { IsEmail, IsNotEmpty, IsString, MinLength, IsEnum, IsOptional } from 'class-validator';

export class SignupDto {
    @IsNotEmpty()
    @IsString()
    first_name: string;

    @IsNotEmpty()
    @IsString()
    last_name: string;

    @IsNotEmpty()
    @IsEmail()
    email: string;

    @IsNotEmpty()
    @IsString()
    @MinLength(8)
    password: string;

    @IsOptional()
    @IsString()
    phone_number?: string;

    @IsNotEmpty()
    @IsEnum(['Admin', 'Student', 'Campus_Admin'])
    user_type: string;

    @IsOptional()
    @IsString()
    campus_id?: string;
} 