import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from 'src/auth/auth.module';
import { ContactController } from './controllers/contact.controller';
import { ContactGateway } from './gateways/contact.gateway';
import { Contact, ContactSchema } from './schemas/contact.schema';
import { ContactService } from './services/contact.service';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([{ name: Contact.name, schema: ContactSchema }]),
  ],
  controllers: [ContactController],
  providers: [ContactService, ContactGateway],
  exports: [ContactService],
})
export class ContactUsModule {} 