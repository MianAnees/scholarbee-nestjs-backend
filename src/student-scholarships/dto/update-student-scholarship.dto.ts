import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional, ValidateNested } from 'class-validator';
import { RequiredDocumentTitleEnum, ScholarshipApprovalStatusEnum, StudentScholarship } from '../schemas/student-scholarship.schema';
import { CreateStudentScholarshipDto } from './create-student-scholarship.dto';

// Base class for approval status
export class UpdateStudentScholarshipApprovalStatusDto {
    @IsEnum(ScholarshipApprovalStatusEnum)
    @IsOptional()
    approval_status?: ScholarshipApprovalStatusEnum = ScholarshipApprovalStatusEnum.Applied;
}


export class AddRequiredDocumentDto {
    @ValidateNested()
    document: StudentScholarship['required_documents'][number];
}


export class RemoveRequiredDocumentDto {
    @IsEnum(RequiredDocumentTitleEnum)
    document_name: RequiredDocumentTitleEnum;
}

// REVIEW (low): Shouldn't OmitType be used to exclude the properties which should not be update-able
export class UpdateStudentScholarshipDto extends PartialType(CreateStudentScholarshipDto)  {
    @IsEnum(ScholarshipApprovalStatusEnum)
    @IsOptional()
    approval_status?: ScholarshipApprovalStatusEnum;
}