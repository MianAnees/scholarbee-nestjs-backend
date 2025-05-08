import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, UpdateQuery } from 'mongoose';
import { ConversationDocument } from 'src/chat/schemas/conversation.schema';
import { EnvValidationSchema } from 'src/config';
import { IConfiguration } from 'src/config/configuration';
import { v4 as uuidv4 } from 'uuid';
import { Message, MessageDocument } from './schemas/message.schema';

@Injectable()
export class ChatSessionService {
    constructor(
        @InjectModel(Message.name) private readonly messageModel: Model<MessageDocument>,
        private readonly configService: ConfigService<IConfiguration & EnvValidationSchema>,
    ) { }

    // Helper: Check if session is valid (last message from student and <1hr old)
    private isSessionValid(now: Date, lastMessageTime?: Date): boolean {
        if (!lastMessageTime) return false;
        const diffMs = now.getTime() - new Date(lastMessageTime).getTime();
        const timeout = this.configService.get('app.chatSessionTimeout', { infer: true });

        return diffMs < timeout;
    }

    // Helper: Get last message in conversation which belongs to a session
    private async getLatestValidSessionMessage(conversationId: string): Promise<MessageDocument | null> {
        return this.messageModel.findOne({
            conversation_id: new Types.ObjectId(conversationId),
            // sessionId should be truthy
            sessionId: { $exists: true, $ne: null }
        })
            .sort({ created_at: -1 })
            .exec();
    }


    // Helper: Get first student message in session
    private async getFirstStudentMessageInSession(conversationId: Types.ObjectId, sessionId: string): Promise<MessageDocument | null> {
        return this.messageModel.findOne({ conversation_id: conversationId, sender_type: 'user', sessionId })
            .sort({ created_at: 1 })
            .exec();
    }

    // Helper: Is this the first campus reply in the session?
    private async isFirstCampusReplyInSession(conversationId: Types.ObjectId, sessionId: string): Promise<boolean> {
        const count = await this.messageModel.countDocuments({ conversation_id: conversationId, sender_type: 'campus', sessionId });
        return count === 0;
    }

    // Helper: Calculate response time in ms
    private calculateResponseTime(start: Date, end: Date): number {
        return end.getTime() - start.getTime();
    }

    private generateSessionId(conversationId: string): string {
        return `${conversationId}-${uuidv4()}`;
    }

    /**
     * Handles all session management logic for message creation.
     * Returns sessionId, conversationDocUpdate, and any other session-related data needed by ChatService.
     */
    async handleSessionOnMessage({
        conversation,
        senderType,
        curMsgTime,
        conversationId,
    }: {
        conversation: ConversationDocument,
        senderType: 'user' | 'campus',
            curMsgTime: Date,
        conversationId: Types.ObjectId,
    }) {


        // Get last message in this conversation
        const latestValidSessionMessage = await this.getLatestValidSessionMessage(conversationId.toString());


        let sessionId = latestValidSessionMessage?.sessionId;
        let conversationDocUpdate: UpdateQuery<ConversationDocument> = {};
        const DEFAULT_RESPONSE = {
            sessionId,
            conversationDocUpdate,
        };

        // Check session validity
        const sessionValid = this.isSessionValid(curMsgTime, latestValidSessionMessage?.created_at);

        if (sessionValid && senderType === 'campus') {
            const isFirstCampusReplyInSession = await this.isFirstCampusReplyInSession(conversationId, sessionId);
            if (!isFirstCampusReplyInSession) return DEFAULT_RESPONSE;

            const firstStudentMsg = await this.getFirstStudentMessageInSession(conversationId, sessionId);
            if (!firstStudentMsg) throw new NotFoundException('First student message not found in this session'); // since each session is initialized with a student message, this should never happen

            const currentResponseTime = this.calculateResponseTime(firstStudentMsg.created_at, curMsgTime);
            const existingAvgResponseTime = conversation?.avgResponseTime;
            const existingSessionsCount = conversation?.sessionsCount;
            const isPrevAvgAndSessionCountExists = existingAvgResponseTime > 0 && existingSessionsCount > 0;


            if (isPrevAvgAndSessionCountExists) {
                const sessionsCountBeforeCurrentSession = existingSessionsCount - 1;
                const existingTotalResponseTime = existingAvgResponseTime * sessionsCountBeforeCurrentSession;
                const newTotalResponseTime = existingTotalResponseTime + currentResponseTime;
                const newAvgResponseTime = newTotalResponseTime / existingSessionsCount;
                conversationDocUpdate.avgResponseTime = newAvgResponseTime;
            } else {
                conversationDocUpdate.avgResponseTime = currentResponseTime;
            }

        } else if (!sessionValid && senderType === 'user') {
            // New session
            sessionId = this.generateSessionId(conversationId.toString());
            conversationDocUpdate.$inc = { sessionsCount: 1 };
        }
        return {
            sessionId,
            conversationDocUpdate,
        };

    }
} 