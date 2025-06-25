import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AdmissionsController } from './controllers/admissions.controller';
import { AdmissionsService } from './services/admissions.service';
import { AdmissionsGateway } from './gateways/admissions.gateway';
import { Admission, AdmissionSchema } from './schemas/admission.schema';
import { IConfiguration } from 'src/config/configuration';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Admission.name, schema: AdmissionSchema },
    ]),
    AuthModule,
  ],
  controllers: [AdmissionsController],
  providers: [AdmissionsService, AdmissionsGateway],
  exports: [AdmissionsService],
})
export class AdmissionsModule {} 