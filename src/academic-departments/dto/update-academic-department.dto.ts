import { PartialType } from '@nestjs/mapped-types';
import { CreateAcademicDepartmentDto } from './create-academic-department.dto';

export class UpdateAcademicDepartmentDto extends PartialType(CreateAcademicDepartmentDto) { } 