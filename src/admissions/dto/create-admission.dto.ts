import { IsArray, IsDate, IsMongoId, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class AnnouncementDto {
    @IsString()
    id: string;

    @IsString()
    key: string;

    @IsString()
    value: string;
}

export class CreateAdmissionDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => AnnouncementDto)
    admission_announcements: AnnouncementDto[];

    @IsDate()
    @Type(() => Date)
    admission_deadline: Date;

    @IsOptional()
    @IsString()
    admission_description?: string;

    @IsOptional()
    @IsDate()
    @Type(() => Date)
    admission_startdate?: Date;

    @IsString()
    admission_title: string;

    @IsOptional()
    @IsNumber()
    available_seats?: number;

    @IsMongoId()
    campus_id: string;

    @IsOptional()
    @IsString()
    poster?: string;

    @IsMongoId()
    university_id: string;
} 