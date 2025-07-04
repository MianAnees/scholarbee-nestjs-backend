import { IsEnum, IsMongoId, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateOrganizationDto {
    @IsString()
    organization_name: string;

    @IsEnum(['government', 'private', 'university'])
    organization_type: string;

    @IsOptional()
    @IsString()
    address?: string;

    @IsOptional()
    @IsString()
    contact_email?: string;

    @IsOptional()
    @IsString()
    contact_phone?: string;

    @IsOptional()
    @IsUrl({ require_protocol: true }, { message: 'Website URL must be a valid URL with protocol (http/https)' })
    website_url?: string;

    @IsOptional()
    @IsUrl({ require_protocol: true }, { message: 'Profile image URL must be a valid URL with protocol (http/https)' })
    profile_image_url?: string;

    @IsOptional()
    @IsMongoId()
    country?: string;

    @IsOptional()
    @IsMongoId()
    region?: string;
} 