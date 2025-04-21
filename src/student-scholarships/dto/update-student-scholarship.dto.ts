import { PartialType, PickType } from '@nestjs/mapped-types';
import { CreateStudentScholarshipDto } from './create-student-scholarship.dto';

export class UpdateStudentScholarshipApprovalStatus extends PickType(CreateStudentScholarshipDto,['approval_status']){}


// REVIEW (low): Shouldn't OmitType be used to exclude the properties which should not be update-able 
export class UpdateStudentScholarshipDto extends PartialType(CreateStudentScholarshipDto) {
   
} 