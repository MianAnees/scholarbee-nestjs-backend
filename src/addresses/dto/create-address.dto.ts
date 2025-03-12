import { IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';

export class CreateAddressDto {
    @IsNotEmpty()
    @IsString()
    address_line_1: string;

    @IsOptional()
    @IsString()
    address_line_2?: string;

    @IsNotEmpty()
    @IsString()
    city: string;

    @IsNotEmpty()
    @IsString()
    state: string;

    @IsNotEmpty()
    @IsString()
    postal_code: string;

    @IsNotEmpty()
    @IsNumber()
    latitude: number;

    @IsNotEmpty()
    @IsNumber()
    longitude: number;
} 