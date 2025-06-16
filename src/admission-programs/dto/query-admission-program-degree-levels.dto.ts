import { IsOptional, IsString } from 'class-validator';

export class QueryAdmissionProgramDegreeLevelsDto {
  @IsOptional()
  @IsString()
  university_id?: string;

  @IsOptional()
  @IsString()
  campus_id?: string;
} 