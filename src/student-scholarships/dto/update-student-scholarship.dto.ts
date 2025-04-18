import { PartialType } from '@nestjs/mapped-types';
import { CreateStudentScholarshipDto } from './create-student-scholarship.dto';

export class UpdateStudentScholarshipDto extends PartialType(CreateStudentScholarshipDto) { } 