import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateProgramTemplateDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    slug?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    group?: string;

    @IsArray()
    @IsOptional()
    tags?: Array<{ id: string; tag: string }>;

    @IsString()
    @IsNotEmpty()
    createdBy: string;
} 