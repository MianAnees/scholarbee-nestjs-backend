import { IsArray, IsDate, IsEnum, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, IsUrl } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateStudentScholarshipDto {
    @IsString()
    @IsNotEmpty()
    scholarship_name: string;

    @IsString()
    @IsNotEmpty()
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
    @IsUrl()
    application_link?: string;

    @IsString()
    @IsOptional()
    application_process?: string;

    @IsString()
    @IsNotEmpty()
    eligibility_criteria: string;

    @IsArray()
    @IsOptional()
    required_documents?: Array<{ id: string; document_name: string }>;

    @IsEnum(['open', 'closed'])
    @IsOptional()
    status?: string = 'open';

    @IsMongoId()
    @IsNotEmpty()
    university_id: string;

    @IsMongoId()
    @IsOptional()
    country?: string;

    @IsMongoId()
    @IsOptional()
    region?: string;

    @IsString()
    @IsNotEmpty()
    createdBy: string;
} 