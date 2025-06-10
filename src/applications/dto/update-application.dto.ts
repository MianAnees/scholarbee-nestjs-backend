import { PartialType } from '@nestjs/mapped-types';
import { CreateApplicationDto } from './create-application.dto';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { ApplicationStatus } from '../schemas/application.schema';
import { Type } from 'class-transformer';
import { IsValidBoolean } from 'src/auth/decorators/is-valid-boolean.decorator';

export class UpdateApplicationDto extends PartialType(CreateApplicationDto) {
  @IsOptional()
  @IsValidBoolean()
  is_submitted?: boolean;
}
