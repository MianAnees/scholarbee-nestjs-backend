import { IsArray, IsMongoId, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class AdmissionRequirementValueChildDto {
    @IsOptional()
    @IsString()
    text?: string;

    @IsOptional()
    @IsString()
    type?: string;

    @IsOptional()
    @IsArray()
    children?: any[];

    @IsOptional()
    @IsString()
    url?: string;

    @IsOptional()
    bold?: boolean;

    @IsOptional()
    italic?: boolean;

    @IsOptional()
    underline?: boolean;

    @IsOptional()
    newTab?: boolean;

    @IsOptional()
    code?: boolean;
}

class AdmissionRequirementValueDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => AdmissionRequirementValueChildDto)
    children: AdmissionRequirementValueChildDto[];

    @IsOptional()
    @IsString()
    type?: string;
}

class AdmissionRequirementDto {
    @IsString()
    id: string;

    @IsString()
    key: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => AdmissionRequirementValueDto)
    value: AdmissionRequirementValueDto[];
}

export class CreateAdmissionProgramDto {
    @IsMongoId()
    admission: string;

    @IsOptional()
    @IsString()
    admission_fee?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => AdmissionRequirementDto)
    admission_requirements: AdmissionRequirementDto[];

    @IsNumber()
    available_seats: number;

    @IsMongoId()
    program: string;

    @IsOptional()
    @IsString()
    redirect_deeplink?: string;
} 