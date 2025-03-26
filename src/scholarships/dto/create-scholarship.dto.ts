import { IsString, IsNumber, IsDate, IsOptional, IsEnum, IsArray, ValidateNested, IsMongoId } from 'class-validator';
import { Type } from 'class-transformer';

class RequiredDocumentDto {
    @IsString()
    id: string;

    @IsString()
    document_name: string;
}

export class CreateScholarshipDto {
    @IsString()
    scholarship_name: string;

    @IsString()
    scholarship_description: string;

    @IsEnum(['merit', 'need', 'local', 'international'])
    scholarship_type: string;

    @IsNumber()
    @IsOptional()
    amount?: number;

    @IsDate()
    @Type(() => Date)
    application_deadline: Date;

    @IsString()
    @IsOptional()
    application_link?: string;

    @IsString()
    @IsOptional()
    application_process?: string;

    @IsString()
    eligibility_criteria: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => RequiredDocumentDto)
    required_documents: RequiredDocumentDto[];

    @IsMongoId()
    university_id: string;

    @IsMongoId()
    @IsOptional()
    country?: string;

    @IsMongoId()
    @IsOptional()
    region?: string;

    @IsString()
    @IsOptional()
    image_url?: string;

    @IsString()
    organization_id: string;
} 