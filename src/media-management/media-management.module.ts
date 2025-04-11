import { Module } from '@nestjs/common';
import { MediaManagementController } from './media-management.controller';
import { MediaManagementService } from './media-management.service';

@Module({
  controllers: [MediaManagementController],
  providers: [MediaManagementService]
})
export class MediaManagementModule { }
