import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Conversation, ConversationSchema } from 'src/chat/schemas/conversation.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Conversation.name, schema: ConversationSchema },
        ]),
    ],
    exports: [MongooseModule], // This is necessary, because the registered models of the "MongooseModule" are no available to the other modules unless the "MongooseModule" with the registered models is exported
})
export class ConversationModelModule { }
