import {
    IsString,
    IsDate,
    IsEnum,
    IsNumber,
    IsObject,
    IsArray,
    ValidateNested,
    IsOptional,
    IsMongoId
} from 'class-validator';
import { Type } from 'class-transformer';

class MarksGpaDto {
    @IsString()
    obtained_marks_gpa: string;

    @IsString()
    total_marks_gpa: string;
}

class EducationalBackgroundDto {
    @IsString()
    id: string;

    @IsString()
    education_level: string;

    @IsString()
    field_of_study: string;

    @IsString()
    school_college_university: string;

    @IsString()
    board: string;

    @IsString()
    year_of_passing: string;

    @ValidateNested()
    @Type(() => MarksGpaDto)
    marks_gpa: MarksGpaDto;

    @IsString()
    transcript: string;
}

class NationalIdCardDto {
    @IsString()
    front_side: string;

    @IsString()
    back_side: string;
}

class ApplicantSnapshotDto {
    @IsString()
    first_name: string;

    @IsOptional()
    @IsString()
    last_name?: string;

    @IsString()
    email: string;

    @IsString()
    phone_number: string;

    @IsDate()
    @Type(() => Date)
    date_of_birth: Date;

    @IsOptional()
    @IsString()
    gender?: string;

    @IsString()
    nationality: string;

    @IsOptional()
    @IsString()
    cnic?: string;

    @IsString()
    profile_image_url: string;

    @IsString()
    city: string;

    @IsString()
    stateOrProvince: string;

    @IsString()
    streetAddress: string;

    @IsString()
    postalCode: string;

    @IsString()
    districtOfDomicile: string;

    @IsString()
    provinceOfDomicile: string;

    @IsString()
    father_name: string;

    @IsOptional()
    @IsString()
    father_status?: string;

    @IsOptional()
    @IsString()
    father_profession?: string;

    @IsOptional()
    @IsString()
    father_income?: string;

    @IsOptional()
    @IsString()
    religion?: string;

    @IsOptional()
    @IsString()
    special_person?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => EducationalBackgroundDto)
    educational_backgrounds: EducationalBackgroundDto[];

    @ValidateNested()
    @Type(() => NationalIdCardDto)
    national_id_card: NationalIdCardDto;

    @IsString()
    user_type: string;
}

class PreferenceDto {
    @IsString()
    id: string;

    @IsMongoId()
    program: string;

    @IsString()
    preference_order: string;
}

class DepartmentDto {
    @IsString()
    id: string;

    @IsMongoId()
    department: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => PreferenceDto)
    preferences: PreferenceDto[];
}

export class CreateApplicationDto {
    @IsMongoId()
    applicant: string;

    @IsMongoId()
    admission_program_id: string;

    @IsMongoId()
    campus_id: string;

    @IsMongoId()
    program: string;

    @IsDate()
    @Type(() => Date)
    submission_date: Date;

    @IsEnum(['Pending', 'Approved', 'Rejected', 'Under Review'])
    status: string;

    @IsNumber()
    total_processing_fee: number;

    @IsObject()
    @ValidateNested()
    @Type(() => ApplicantSnapshotDto)
    applicant_snapshot: ApplicantSnapshotDto;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => DepartmentDto)
    departments: DepartmentDto[];
} 