import { PartialType } from '@nestjs/mapped-types';
import { CreateAdmissionProgramDto } from './create-admission-program.dto';

export class UpdateAdmissionProgramDto extends PartialType(CreateAdmissionProgramDto) { } 