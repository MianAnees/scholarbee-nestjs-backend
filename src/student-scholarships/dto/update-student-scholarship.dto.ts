import { OmitType, PartialType, PickType } from '@nestjs/mapped-types';
import { IsEnum, IsObject, IsOptional, ValidateNested } from 'class-validator';
import { RequiredDocumentTitleEnum, ScholarshipApprovalStatusEnum, StudentScholarship } from '../schemas/student-scholarship.schema';
import { CreateStudentScholarshipDto, RequiredDocumentDto, StudentSnapshotDto, LastDegreeDto } from './create-student-scholarship.dto';
import { Type } from 'class-transformer';

// Base class for approval status
export class UpdateStudentScholarshipApprovalStatusDto {
    @IsEnum(ScholarshipApprovalStatusEnum)
    @IsOptional()
    approval_status?: ScholarshipApprovalStatusEnum = ScholarshipApprovalStatusEnum.Applied;
}


export class AddRequiredDocumentDto {
    @ValidateNested()
    @Type(() => RequiredDocumentDto)
    document: StudentScholarship['required_documents'][number];
}


export class RemoveRequiredDocumentDto {
    @IsEnum(RequiredDocumentTitleEnum)
    document_name: RequiredDocumentTitleEnum;
}



class UpdateStudentScholarship_StudentSnapshotDto extends PartialType(StudentSnapshotDto) {}

// REVIEW (low): Shouldn't OmitType be used to exclude the properties which should not be update-able
export class UpdateStudentScholarshipDto extends PartialType(
    OmitType(
        CreateStudentScholarshipDto, 
        ['student_id', 'scholarship_id','student_snapshot']
    )
) {
    @IsOptional()
    @IsObject()
    @ValidateNested()
    @Type(() => UpdateStudentScholarship_StudentSnapshotDto)
    student_snapshot?: Partial<StudentSnapshotDto>;
}