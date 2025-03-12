import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { Conversation, ConversationSchema } from './schemas/conversation.schema';
import { Message, MessageSchema } from './schemas/message.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Campus, CampusSchema } from '../campuses/schemas/campus.schema';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Conversation.name, schema: ConversationSchema },
            { name: Message.name, schema: MessageSchema },
            { name: User.name, schema: UserSchema },
            { name: Campus.name, schema: CampusSchema },
        ]),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET'),
                signOptions: { expiresIn: '1d' },
            }),
        }),
    ],
    controllers: [ChatController],
    providers: [ChatService, ChatGateway],
    exports: [ChatService, ChatGateway],
})
export class ChatModule { } 