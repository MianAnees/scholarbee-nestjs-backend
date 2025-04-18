import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AdmissionProgramsController } from './controllers/admission-programs.controller';
import { AdmissionProgramsService } from './services/admission-programs.service';
import { AdmissionProgramsGateway } from './gateways/admission-programs.gateway';
import { AdmissionProgram, AdmissionProgramSchema } from './schemas/admission-program.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: AdmissionProgram.name, schema: AdmissionProgramSchema }
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
    controllers: [AdmissionProgramsController],
    providers: [
        AdmissionProgramsService,
        AdmissionProgramsGateway
    ],
    exports: [AdmissionProgramsService]
})
export class AdmissionProgramsModule { } 