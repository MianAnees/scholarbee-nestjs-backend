import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { Campus, CampusSchema } from '../campuses/schemas/campus.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { ChatSessionService } from './chat-session.service';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { ConversationModelModule } from './conversation-models.module';
import { Message, MessageSchema } from './schemas/message.schema';

@Module({
    imports: [
        ConversationModelModule,
        MongooseModule.forFeature([
            { name: Message.name, schema: MessageSchema },
            { name: User.name, schema: UserSchema },
            { name: Campus.name, schema: CampusSchema },
        ]),
        JwtModule.registerAsync({
            // imports: [ConfigModule], // Review: Is this import necessary, as it's already imported in the AppModule as global?
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET'),
                signOptions: { expiresIn: '1d' },
            }),
        }),
    ],
    controllers: [ChatController],
    providers: [ChatService, ChatGateway, ChatSessionService],
    exports: [ChatService, ChatGateway, ChatSessionService],
})
export class ChatModule { } 