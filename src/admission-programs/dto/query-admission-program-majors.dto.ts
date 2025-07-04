import { IsOptional, IsString } from 'class-validator';

export class QueryAdmissionProgramMajorsDto {
  @IsOptional()
  @IsString()
  university_id?: string;

  @IsOptional()
  @IsString()
  campus_id?: string;
} 