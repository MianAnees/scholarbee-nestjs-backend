import { OmitType, PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { ScholarshipApprovalStatusEnum } from '../schemas/student-scholarship.schema';
import {
  CreateStudentScholarshipDto,
  RequiredDocumentDto,
  StudentSnapshotDto,
} from './create-student-scholarship.dto';
import { RequiredDocumentTitleEnum } from 'src/common/constants/shared.constants';

// Base class for approval status
export class UpdateStudentScholarshipApprovalStatusDto {
  @IsEnum(ScholarshipApprovalStatusEnum)
  @IsNotEmpty()
  approval_status: ScholarshipApprovalStatusEnum;
}

export class AddRequiredDocumentDto {
  @ValidateNested()
  @Type(() => RequiredDocumentDto)
  document: RequiredDocumentDto;
}

export class RemoveRequiredDocumentDto {
  @IsEnum(RequiredDocumentTitleEnum)
  document_name: RequiredDocumentTitleEnum;
}

class UpdateStudentScholarship_StudentSnapshotDto extends PartialType(
  StudentSnapshotDto,
) {}

// REVIEW (low): Shouldn't OmitType be used to exclude the properties which should not be update-able
export class UpdateStudentScholarshipDto extends PartialType(
  OmitType(CreateStudentScholarshipDto, [
    'student_id',
    'scholarship_id',
    'student_snapshot',
  ]),
) {
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => UpdateStudentScholarship_StudentSnapshotDto)
  student_snapshot?: Partial<StudentSnapshotDto>;
}
