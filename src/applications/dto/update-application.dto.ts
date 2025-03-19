import { PartialType } from '@nestjs/mapped-types';
import { CreateApplicationDto } from './create-application.dto';
import { IsEnum, IsOptional } from 'class-validator';

export class UpdateApplicationDto extends PartialType(CreateApplicationDto) {
    @IsOptional()
    @IsEnum(['Pending', 'Approved', 'Rejected', 'Under Review'])
    status?: string;
} 