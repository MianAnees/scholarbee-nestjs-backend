import { PartialType, PickType } from '@nestjs/mapped-types';
import { CreateStudentScholarshipDto } from './create-student-scholarship.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { StudentScholarshipApprovalStatus } from '../schemas/student-scholarship.schema';

// Base class for approval status
export class UpdateStudentScholarshipApprovalStatusDto {
    @IsEnum(StudentScholarshipApprovalStatus)
    @IsOptional()
    approval_status?: StudentScholarshipApprovalStatus = StudentScholarshipApprovalStatus.APPLIED;
}

// REVIEW (low): Shouldn't OmitType be used to exclude the properties which should not be update-able
export class UpdateStudentScholarshipDto extends PartialType(CreateStudentScholarshipDto)  {
    @IsEnum(StudentScholarshipApprovalStatus)
    @IsOptional()
    approval_status?: StudentScholarshipApprovalStatus;
}