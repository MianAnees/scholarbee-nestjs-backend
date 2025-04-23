import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsMongoId, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import { ParseObjectId } from 'nestjs-object-id';
import { FatherLivingStatusEnum, LastDegreeLevelEnum, RequiredDocumentTitleEnum, StudentScholarship } from '../schemas/student-scholarship.schema';


// last_degree DTO
export class LastDegreeDto {
    @IsString()
    @IsEnum(LastDegreeLevelEnum)
    level: LastDegreeLevelEnum;

    @IsNumber()
    @Type(() => Number)
    percentage: number;
}

// student_snapshot DTO
export class StudentSnapshotDto {
    @IsString()
    @IsEnum(FatherLivingStatusEnum)
    father_status: FatherLivingStatusEnum;

    @IsNumber()
    @Type(() => Number)
    monthly_household_income: number;

    @ValidateNested()
    last_degree: LastDegreeDto;
}

export class RequiredDocumentDto {
    @IsString()
    @IsEnum(RequiredDocumentTitleEnum)
    document_name: RequiredDocumentTitleEnum;

    @IsString()
    document_link: string;
}


export class CreateStudentScholarshipDto {
    @IsMongoId()
    @ParseObjectId()
    @IsNotEmpty()
    student_id: StudentScholarship['student_id'];

    @IsMongoId()
    @ParseObjectId()
    @IsNotEmpty()
    scholarship_id: StudentScholarship['scholarship_id'];

    @IsOptional()
    @IsString()
    reference_1: StudentScholarship['reference_1'];

    @IsOptional()
    @IsString()
    reference_2: StudentScholarship['reference_2'];

    @IsOptional()
    @IsString()
    personal_statement: StudentScholarship['personal_statement'];

    @IsNotEmpty()
    @IsObject()
    @ValidateNested()
    student_snapshot: StudentSnapshotDto;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    required_documents?: RequiredDocumentDto[];
}
