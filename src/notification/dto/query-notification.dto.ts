import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';


export namespace NotificationQuery {
  export enum Scope {
    GLOBAL = 'global',
    SPECIFIC = 'specific',
    ALL = 'all',
  }

  export enum ReadStatus {
    ANY = 'any',
    UNREAD = 'unread',
  }
}

export class QueryNotificationDto extends PaginationDto {
  @IsOptional()
  @IsEnum(NotificationQuery.Scope)
  scope?: NotificationQuery.Scope = NotificationQuery.Scope.SPECIFIC;

  @IsOptional()
  @IsEnum(NotificationQuery.ReadStatus)
  read_status?: NotificationQuery.ReadStatus =
    NotificationQuery.ReadStatus.UNREAD;
}

// DTO for querying campus notifications (for campus admins)
export class QueryCampusNotificationDto extends QueryNotificationDto { }
