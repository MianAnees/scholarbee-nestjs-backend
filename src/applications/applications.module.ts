import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from 'src/auth/auth.module';
import { User, UserSchema } from '../users/schemas/user.schema';
import { ApplicationsController } from './controllers/applications.controller';
import { ApplicationsGateway } from './gateways/applications.gateway';
import { Application, ApplicationSchema } from './schemas/application.schema';
import { ApplicationsService } from './services/applications.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Application.name, schema: ApplicationSchema },
      { name: User.name, schema: UserSchema },
    ]),
    AuthModule,
  ],
  controllers: [ApplicationsController],
  providers: [ApplicationsService, ApplicationsGateway],
  exports: [ApplicationsService],
})
export class ApplicationsModule {} 