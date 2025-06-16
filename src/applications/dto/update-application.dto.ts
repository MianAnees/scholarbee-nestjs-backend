import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { IsValidBoolean } from 'src/auth/decorators/is-valid-boolean.decorator';
import { CreateApplicationDto } from './create-application.dto';
import { ApplicationStatus } from '../schemas/application.schema';

export class UpdateApplicationDto extends PartialType(CreateApplicationDto) {
  @IsOptional()
  @IsValidBoolean()
  is_submitted?: boolean;
}

export class UpdateApplicationStatusDto {
  @IsNotEmpty()
  @IsEnum(ApplicationStatus) // TODO: If this api is meant for admins, then only allow status to be one of the following: APPROVED, REJECTED, UNDER_REVIEW
  status: ApplicationStatus;
}
