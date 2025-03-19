import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateRegionDto {
    @IsString()
    @IsNotEmpty()
    region_name: string;

    @IsString()
    @IsNotEmpty()
    country: string;

    @IsArray()
    @IsOptional()
    cities?: string[];
} 