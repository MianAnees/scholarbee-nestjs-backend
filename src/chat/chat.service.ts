import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, UpdateQuery } from 'mongoose';
import { Campus, CampusDocument } from '../campuses/schemas/campus.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { ChatSessionService } from './chat-session.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { Conversation, ConversationDocument } from './schemas/conversation.schema';
import { Message, MessageDocument } from './schemas/message.schema';

@Injectable()
export class ChatService {
    constructor(
        @InjectModel(Conversation.name) private conversationModel: Model<ConversationDocument>,
        @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        @InjectModel(Campus.name) private campusModel: Model<CampusDocument>,
        private readonly chatSessionService: ChatSessionService
    ) { }

    async createConversation(createConversationDto: CreateConversationDto, userId: string): Promise<Conversation> {
        try {
            // Validate IDs
            if (!Types.ObjectId.isValid(userId)) {
                throw new BadRequestException(`Invalid user ID: ${userId}`);
            }

            if (!Types.ObjectId.isValid(createConversationDto.campus_id)) {
                throw new BadRequestException(`Invalid campus ID: ${createConversationDto.campus_id}`);
            }

            // Check if conversation already exists
            const existingConversation = await this.conversationModel.findOne({
                user_id: new Types.ObjectId(userId),
                campus_id: new Types.ObjectId(createConversationDto.campus_id),
                is_active: true
            });

            if (existingConversation) {
                return existingConversation;
            }

            // Create new conversation
            const newConversation = new this.conversationModel({
                user_id: new Types.ObjectId(userId),
                campus_id: new Types.ObjectId(createConversationDto.campus_id),
                last_message_time: new Date(),
                is_read_by_user: true,
                is_read_by_campus: false,
                is_active: true
            });

            return await newConversation.save();
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }

            // Handle MongoDB duplicate key error (code 11000)
            if (error.code === 11000) {
                // Find and return the existing conversation instead of throwing an error
                const existingConversation = await this.conversationModel.findOne({
                    user_id: new Types.ObjectId(userId),
                    campus_id: new Types.ObjectId(createConversationDto.campus_id)
                });

                if (existingConversation) {
                    return existingConversation;
                }

                throw new BadRequestException('Conversation already exists between this user and campus');
            }

            if (error.message.includes('hex string must be 24 characters')) {
                throw new BadRequestException('Invalid ID format. IDs must be valid MongoDB ObjectIds.');
            }

            throw error;
        }
    }

    async findAllConversationsForUser(userId: string) {
        if (!Types.ObjectId.isValid(userId)) {
            throw new BadRequestException(`Invalid user ID: ${userId}`);
        }

        return this.conversationModel.find({
            user_id: new Types.ObjectId(userId),
            is_active: true
        })
            .populate({
                path: 'user_id',
                select: '_id first_name last_name email user_type'
            })
            .populate('campus_id')
            .sort({ last_message_time: -1 })
            .exec();
    }

    async findAllConversationsForCampus(campusId: string) {
        if (!Types.ObjectId.isValid(campusId)) {
            throw new BadRequestException(`Invalid campus ID: ${campusId}`);
        }

        return this.conversationModel.find({
            campus_id: new Types.ObjectId(campusId),
            is_active: true
        })
            .populate({
                path: 'user_id',
                select: '_id first_name last_name email user_type'
            })
            .populate('campus_id')
            .sort({ last_message_time: -1 })
            .exec();
    }

    async findConversation(id: string) {
        const conversation = await this.conversationModel.findById(id)
            .populate('user_id')
            .populate('campus_id')
            .exec();

        if (!conversation) {
            throw new NotFoundException('Conversation not found');
        }

        return conversation;
    }

    async updateConversation(id: string, updateConversationDto: UpdateConversationDto) {
        const conversation = await this.conversationModel.findByIdAndUpdate(
            id,
            updateConversationDto,
            { new: true }
        );

        if (!conversation) {
            throw new NotFoundException('Conversation not found');
        }

        return conversation;
    }

    async markConversationAsReadByUser(id: string) {
        return await this.conversationModel.findByIdAndUpdate(
            id,
            { is_read_by_user: true },
            { new: true }
        );
    }

    async markConversationAsReadByCampus(id: string) {
        return await this.conversationModel.findByIdAndUpdate(
            id,
            { is_read_by_campus: true },
            { new: true }
        );
    }

    async deleteConversation(id: string) {
        // Soft delete by setting is_active to false
        const conversation = await this.conversationModel.findByIdAndUpdate(
            id,
            { is_active: false },
            { new: true }
        );

        if (!conversation) {
            throw new NotFoundException('Conversation not found');
        }

        return { message: 'Conversation deleted successfully' };
    }

    /**
     * * How to "check for session validity" (a session is always started from a student message)
     * ? isSentByStudent AND isLastMessageInConversionFresh (gap < 1hr)
     * 
     * * How to "update average response time" 
     * get the existing sessionsCount 
     * TODO: calculate the current session's responseTime
     * TODO: check if responseTime exists in the conversation already
     * ? isResponseTimeExists,
     *      calculate the avgResponseTime ((prevAvg * prevCount + currentResponseTime) / newCount) and update field
     * ? isResponseTimeNotExists,
     *   -   store the current session's response as averageResponseTime
     * 
     * * How to "calculate the current session's responseTime"
     * get the first student message in this conversation
     * TODO: timeDiff(currentMessageTime - timeOfFirstStudentMessageInThisSession)
     * 
     * 
     * * On each new message
     * TODO: get sender type of the message => senderType
     * TODO: check for session validity
     * ? isExistingSessionValid:
     *   ? isSentByStudent (senderType === 'user'), 
     *       1.2a.1 do nothing;
     *   ? isSentByCampus,
     *       TODO: check if this is the first message from campus in this session
     *       ? isCurrentMessageTheFirstCampusMessageInSession,
     *           TODO: update average response time
     *       ? isCurrentMessageNotTheFirstCampusMessageInSession,
     *       -   do nothing;
     * ? isExistingSessionInvalid:
     *   ? isSentByStudent, 
     *       -   update sessionsCount
     *       -   update sessionId
     *   ? isSentByCampus,
     *       -   do nothing;
     * 
     * 
     * @param createMessageDto 
     * @param userId 
     * @param senderType 
     * @returns 
     */
    async createMessage(createMessageDto: CreateMessageDto, userId: string, senderType: 'user' | 'campus'): Promise<Message> {
        try {
            // Validate IDs
            if (!Types.ObjectId.isValid(userId)) {
                throw new BadRequestException(`Invalid user ID: ${userId}`);
            }
            if (!Types.ObjectId.isValid(createMessageDto.conversation_id)) {
                throw new BadRequestException(`Invalid conversation ID: ${createMessageDto.conversation_id}`);
            }
            const conversationId = new Types.ObjectId(createMessageDto.conversation_id);
            const currentConversation = await this.conversationModel.findById(conversationId);
            if (!currentConversation) {
                throw new NotFoundException(`Conversation with ID ${createMessageDto.conversation_id} not found`);
            }

            // Get current time
            const curMsgTime = new Date();

            // Determine the correct sender_id based on sender_type
            let senderId: Types.ObjectId;
            if (senderType === 'user') {
                senderId = new Types.ObjectId(userId);
            } else {
                senderId = currentConversation.campus_id;
            }

            // Delegate all session logic to ChatSessionService
            const sessionResult = await this.chatSessionService.handleSessionOnMessage({
                conversation: currentConversation,
                senderType,
                curMsgTime,
                conversationId
            });

            // Create message object
            let messageData: Partial<MessageDocument> = {
                conversation_id: conversationId,
                sender_id: senderId,
                sender_type: senderType,
                sender_type_ref: senderType === 'user' ? 'User' : 'Campus',
                content: createMessageDto.content,
                is_read_by_user: senderType === 'user',
                is_read_by_campus: senderType === 'campus',
                attachments: createMessageDto.attachments || [],
                created_at: curMsgTime,
                sessionId: sessionResult.sessionId,
            };

            if (senderType === 'campus') {
                messageData.replied_by_user_id = new Types.ObjectId(userId);
            }

            // Create new message
            const newMessage = new this.messageModel(messageData);
            const savedMessage = await newMessage.save();
            // Update conversation with last message info and session updates
            await this.conversationModel.findByIdAndUpdate(
                conversationId,
                {
                    last_message: createMessageDto.content,
                    last_message_time: curMsgTime,
                    last_message_sender: senderType,
                    is_read_by_user: senderType === 'user',
                    is_read_by_campus: senderType === 'campus',
                    ...sessionResult.conversationDocUpdate
                }
            );
            return savedMessage;
        } catch (error) {
            if (error instanceof BadRequestException || error instanceof NotFoundException) {
                throw error;
            }
            if (error.message.includes('hex string must be 24 characters')) {
                throw new BadRequestException('Invalid ID format. IDs must be valid MongoDB ObjectIds.');
            }
            throw error;
        }
    }

    async getMessagesByConversation(conversationId: string, page: number = 1, limit: number = 20) {
        try {
            // Validate conversationId
            if (!Types.ObjectId.isValid(conversationId)) {
                throw new BadRequestException(`Invalid conversation ID: ${conversationId}`);
            }

            const skip = (page - 1) * limit;

            // Find the conversation to verify it exists
            const conversation = await this.conversationModel.findById(
                new Types.ObjectId(conversationId)
            );

            if (!conversation) {
                throw new NotFoundException(`Conversation with ID ${conversationId} not found`);
            }

            // Get messages
            const [messages, total] = await Promise.all([
                this.messageModel.find({
                    conversation_id: new Types.ObjectId(conversationId)
                })
                    .sort({ created_at: -1 })
                    .skip(skip)
                    .limit(limit)
                    .exec(),
                this.messageModel.countDocuments({
                    conversation_id: new Types.ObjectId(conversationId)
                }),
            ]);

            // Manually populate sender details based on sender_type
            const populatedMessages = await Promise.all(
                messages.map(async (message) => {
                    const messageObj = message.toObject();

                    try {
                        if (messageObj.sender_type === 'user') {
                            // Populate from User model
                            const user = await this.userModel.findById(messageObj.sender_id)
                                .select('first_name last_name email profile_image user_type')
                                .exec();

                            if (user) {
                                messageObj.sender = user.toObject();
                            }
                        } else if (messageObj.sender_type === 'campus') {
                            // Populate from Campus model
                            const campus = await this.campusModel.findById(messageObj.sender_id)
                                .select('name logo_url contact_email contact_phone')
                                .exec();

                            if (campus) {
                                messageObj.sender = campus.toObject();

                                // Also populate the user who replied on behalf of the campus
                                if (messageObj.replied_by_user_id) {
                                    const repliedByUser = await this.userModel.findById(messageObj.replied_by_user_id)
                                        .select('first_name last_name email user_type')
                                        .exec();

                                    if (repliedByUser) {
                                        messageObj.replied_by_user = repliedByUser.toObject();
                                    }
                                }
                            }
                        }
                    } catch (error) {
                        console.error(`Error populating sender for message ${messageObj._id}:`, error);
                    }

                    return messageObj;
                })
            );

            return {
                data: populatedMessages,
                meta: {
                    total,
                    page,
                    limit,
                    pages: Math.ceil(total / limit),
                },
            };
        } catch (error) {
            if (error instanceof BadRequestException || error instanceof NotFoundException) {
                throw error;
            }
            if (error.message.includes('hex string must be 24 characters')) {
                throw new BadRequestException('Invalid conversation ID format. Must be a valid MongoDB ObjectId.');
            }
            throw error;
        }
    }

    async markMessagesAsRead(conversationId: string, userType: 'user' | 'campus') {
        try {
            // Validate conversationId
            if (!Types.ObjectId.isValid(conversationId)) {
                throw new BadRequestException(`Invalid conversation ID: ${conversationId}`);
            }

            // Mark all messages from the other party as read
            const senderType = userType === 'user' ? 'campus' : 'user';
            const readField = userType === 'user' ? 'is_read_by_user' : 'is_read_by_campus';

            await this.messageModel.updateMany(
                {
                    conversation_id: new Types.ObjectId(conversationId),
                    sender_type: senderType,
                    [readField]: false
                },
                { [readField]: true }
            );

            // Update conversation read status
            const updateField = userType === 'user'
                ? { is_read_by_user: true }
                : { is_read_by_campus: true };

            await this.conversationModel.findByIdAndUpdate(
                conversationId,
                updateField
            );

            return { message: 'Messages marked as read' };
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            if (error.message.includes('hex string must be 24 characters')) {
                throw new BadRequestException('Invalid conversation ID format. Must be a valid MongoDB ObjectId.');
            }
            throw error;
        }
    }
} 