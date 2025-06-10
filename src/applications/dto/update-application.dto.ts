import { PartialType } from '@nestjs/mapped-types';
import { CreateApplicationDto } from './create-application.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { ApplicationStatus } from '../schemas/application.schema';

export class UpdateApplicationDto extends PartialType(CreateApplicationDto) {
  @IsOptional()
  @IsEnum([ApplicationStatus.DRAFT, ApplicationStatus.PENDING])
  status?: ApplicationStatus.DRAFT | ApplicationStatus.PENDING;
}
