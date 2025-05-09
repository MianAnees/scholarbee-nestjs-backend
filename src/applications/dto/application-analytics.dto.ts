import { IsDateString, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ApplicationProgressStep } from 'src/applications/schemas/application-metrics.schema';

export class ApplicationMetricDto {
    @IsString()
    @IsNotEmpty()
    applicationId: string;

    @IsEnum(ApplicationProgressStep)
    step: ApplicationProgressStep;

    @IsString()
    @IsNotEmpty()
    universityId: string;

    @IsString()
    @IsNotEmpty()
    programId: string;

    @IsDateString()
    timestamp: string;

    @IsString()
    @IsNotEmpty()
    eventType: string;

    @IsString()
    @IsNotEmpty()
    userId: string;
}