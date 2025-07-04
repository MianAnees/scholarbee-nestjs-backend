import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CampusesService } from './campuses.service';
import { CampusesController } from './campuses.controller';
import { Campus, CampusSchema } from './schemas/campus.schema';
import { User, UserSchema } from '../users/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Campus.name, schema: CampusSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [CampusesController],
  providers: [CampusesService],
  exports: [CampusesService],
})
export class CampusesModule {}
