import { IsOptional, IsNumber, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryAnalyticsCommonDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number = 10;

  /**
   * Optional time range filter: 'weekly' or 'monthly'.
   * If not provided, returns all data.
   */
  @IsOptional()
  @IsIn(['weekly', 'monthly'])
  time_range?: 'weekly' | 'monthly';
}
