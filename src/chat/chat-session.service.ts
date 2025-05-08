import { Injectable } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { Message, MessageDocument } from './schemas/message.schema';
import { ConfigService } from '@nestjs/config';
import { IConfiguration } from 'src/config/configuration';
import { EnvValidationSchema } from 'src/config';

@Injectable()
export class ChatSessionService {
    constructor(
        private readonly messageModel: Model<MessageDocument>,
        private readonly configService: ConfigService<IConfiguration & EnvValidationSchema>,
    ) { }

    // Helper: Check if session is valid (last message from student and <1hr old)
    isSessionValid(now: Date, lastMessageTime?: Date): boolean {
        if (!lastMessageTime) return false;
        const diffMs = now.getTime() - new Date(lastMessageTime).getTime();
        const timeout = this.configService.get('app.chatSessionTimeout', { infer: true });

        return diffMs < timeout;
    }

    // Helper: Get last message in conversation which belongs to a session
    async getLatestValidSessionMessage(conversationId: Types.ObjectId): Promise<MessageDocument | null> {
        return this.messageModel.findOne({
            conversation_id: conversationId,
            // sessionId should be truthy
            sessionId: { $exists: true, $ne: null }
        })
            .sort({ created_at: -1 })
            .exec();
    }


    // Helper: Get first student message in session
    async getFirstStudentMessageInSession(conversationId: Types.ObjectId, sessionId: string): Promise<MessageDocument | null> {
        return this.messageModel.findOne({ conversation_id: conversationId, sender_type: 'user', sessionId })
            .sort({ created_at: 1 })
            .exec();
    }

    // Helper: Is this the first campus reply in the session?
    async isFirstCampusReplyInSession(conversationId: Types.ObjectId, sessionId: string): Promise<boolean> {
        const count = await this.messageModel.countDocuments({ conversation_id: conversationId, sender_type: 'campus', sessionId });
        return count === 0;
    }

    // Helper: Calculate response time in ms
    calculateResponseTime(start: Date, end: Date): number {
        return end.getTime() - start.getTime();
    }

    generateSessionId(conversationId: Types.ObjectId | string): string {
        return `${conversationId.toString()}-${uuidv4()}`;
    }
} 