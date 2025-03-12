import { IsString, IsOptional, IsNumber, IsDateString } from 'class-validator';

export class CreateUniversityDto {
    @IsString()
    name: string;

    @IsOptional()
    @IsDateString()
    founded?: Date;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    address_id?: string;

    @IsOptional()
    @IsString()
    website?: string;

    @IsOptional()
    @IsString()
    ranking?: string;

    @IsOptional()
    @IsString()
    affiliations?: string;

    @IsOptional()
    @IsString()
    motto?: string;

    @IsOptional()
    @IsString()
    colors?: string;

    @IsOptional()
    @IsString()
    mascot?: string;

    @IsOptional()
    @IsString()
    type?: string;

    @IsOptional()
    @IsNumber()
    total_students?: number;

    @IsOptional()
    @IsNumber()
    total_faculty?: number;

    @IsOptional()
    @IsNumber()
    total_alumni?: number;

    @IsOptional()
    @IsString()
    endowment?: string;

    @IsOptional()
    @IsString()
    campus_size?: string;

    @IsOptional()
    @IsNumber()
    annual_budget?: number;

    @IsOptional()
    @IsNumber()
    research_output?: number;

    @IsOptional()
    @IsNumber()
    international_students?: number;

    @IsOptional()
    @IsString()
    languages?: string;

    @IsOptional()
    @IsString()
    logo_url?: string;

    @IsOptional()
    @IsString()
    accreditations?: string;

    @IsOptional()
    @IsString()
    notable_alumni?: string;
} 