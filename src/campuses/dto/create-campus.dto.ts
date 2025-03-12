import { IsString, IsOptional, IsNumber, IsBoolean, IsDateString } from 'class-validator';

export class CreateCampusDto {
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    university_id?: string;

    @IsOptional()
    @IsString()
    address_id?: string;

    @IsOptional()
    @IsString()
    campus_type?: string;

    @IsOptional()
    @IsDateString()
    established_date?: Date;

    @IsOptional()
    @IsNumber()
    campus_area?: number;

    @IsOptional()
    @IsString()
    website?: string;

    @IsOptional()
    @IsString()
    contact_phone?: string;

    @IsOptional()
    @IsString()
    contact_email?: string;

    @IsOptional()
    @IsString()
    logo_url?: string;

    @IsOptional()
    @IsNumber()
    latitude?: number;

    @IsOptional()
    @IsNumber()
    longitude?: number;

    @IsOptional()
    @IsNumber()
    student_population?: number;

    @IsOptional()
    @IsBoolean()
    library_facilities?: boolean;

    @IsOptional()
    @IsBoolean()
    sports_facilities?: boolean;

    @IsOptional()
    @IsBoolean()
    dining_options?: boolean;

    @IsOptional()
    @IsBoolean()
    transportation_options?: boolean;

    @IsOptional()
    @IsBoolean()
    residential_facilities?: boolean;

    @IsOptional()
    @IsBoolean()
    healthcare_facilities?: boolean;

    @IsOptional()
    @IsBoolean()
    parking_facilities?: boolean;

    @IsOptional()
    @IsBoolean()
    security_features?: boolean;

    @IsOptional()
    @IsString()
    facilities?: string;

    @IsOptional()
    @IsString()
    accreditations?: string;
} 