import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from 'src/auth/auth.module';
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
    AuthModule,
    ConversationModelModule,
    MongooseModule.forFeature([
      { name: Message.name, schema: MessageSchema },
      { name: User.name, schema: UserSchema },
      { name: Campus.name, schema: CampusSchema },
    ]),
  ],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway, ChatSessionService],
  exports: [ChatService, ChatGateway, ChatSessionService],
})
export class ChatModule {}
