import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AdmissionsController } from './controllers/admissions.controller';
import { AdmissionsService } from './services/admissions.service';
import { AdmissionsGateway } from './gateways/admissions.gateway';
import { Admission, AdmissionSchema } from './schemas/admission.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Admission.name, schema: AdmissionSchema }
        ]),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET'),
                signOptions: { expiresIn: configService.get<string>('JWT_EXPIRATION', '1d') },
            }),
        }),
    ],
    controllers: [AdmissionsController],
    providers: [
        AdmissionsService,
        AdmissionsGateway
    ],
    exports: [AdmissionsService]
})
export class AdmissionsModule { } 