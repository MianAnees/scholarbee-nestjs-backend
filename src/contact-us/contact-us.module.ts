import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ContactController } from './controllers/contact.controller';
import { ContactService } from './services/contact.service';
import { ContactGateway } from './gateways/contact.gateway';
import { Contact, ContactSchema } from './schemas/contact.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Contact.name, schema: ContactSchema }
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
    controllers: [ContactController],
    providers: [
        ContactService,
        ContactGateway
    ],
    exports: [ContactService]
})
export class ContactUsModule { } 