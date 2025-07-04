import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApplicationProgressStep } from 'src/analytics/schema/application-metrics.schema';

export class ApplicationMetricRegisterEventDto {
  @IsEnum(ApplicationProgressStep)
  step: ApplicationProgressStep;

  @IsString()
  @IsNotEmpty()
  campusId: string;

  @IsString()
  @IsNotEmpty()
  universityId: string;

  @IsString()
  @IsNotEmpty()
  programId: string;

  @IsString()
  @IsNotEmpty()
  admissionProgramId: string;

  @IsOptional()
  @IsString()
  eventType: string = 'navigate';
}
