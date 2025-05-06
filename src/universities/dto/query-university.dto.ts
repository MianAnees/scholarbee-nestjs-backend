import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';

class PaginationDto {
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    page?: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    limit?: number = 10;

    @IsOptional()
    @IsString()
    sortBy?: string = 'createdAt';

    @IsOptional()
    @IsString()
    order?: 'asc' | 'desc' = 'desc';
}

export class QueryUniversityDto extends PaginationDto {

    @IsOptional()
    @IsString()
    name?: string;

} 