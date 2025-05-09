import { IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryAnalyticsCommonDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number = 10;
}
