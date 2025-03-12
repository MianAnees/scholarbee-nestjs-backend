import { PartialType } from '@nestjs/mapped-types';
import { CreateConversationDto } from './create-conversation.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateConversationDto extends PartialType(CreateConversationDto) {
    @IsOptional()
    @IsBoolean()
    is_read_by_user?: boolean;

    @IsOptional()
    @IsBoolean()
    is_read_by_campus?: boolean;

    @IsOptional()
    @IsBoolean()
    is_active?: boolean;
} 