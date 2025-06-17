import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersController } from './users.controller';
import { User, UserSchema } from './schemas/user.schema';
import { UsersService } from './users.service';
import { CampusAdminCacheService } from 'src/common/services/campus-admin-cache.service';
import { ChatModule } from 'src/chat/chat.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [UsersController],
  providers: [UsersService, CampusAdminCacheService],
  exports: [UsersService],
})
export class UsersModule {}
