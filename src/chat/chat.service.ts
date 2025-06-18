import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AuthenticatedRequest } from 'src/auth/types/auth.interface';
import { CampusAdminCacheService } from 'src/common/services/campus-admin-cache.service';
import { Campus, CampusDocument } from '../campuses/schemas/campus.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { ChatSessionService } from './chat-session.service';
import { ChatGateway } from './chat.gateway';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import {
  Conversation,
  ConversationDocument,
  ConversationParticipantType,
} from './schemas/conversation.schema';
import {
  isPopulatedAll,
  PopulatedConversationAll,
} from './schemas/conversation.schema.utils';
import { Message, MessageDocument } from './schemas/message.schema';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    @InjectModel(Conversation.name)
    private conversationModel: Model<ConversationDocument>,
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Campus.name) private campusModel: Model<CampusDocument>,
    private readonly chatSessionService: ChatSessionService,
    @Inject(forwardRef(() => ChatGateway))
    private readonly chatGateway: ChatGateway,
    /**
     * Why is this required:
     * - In the chat system, when a user sends a message to a campus, the message must be delivered to all campus admins.
     * - To do this, we need to quickly retrieve the user IDs of all campus admins associated with a campus.
     *
     * Why caching is used:
     * - The list of campus admins for a campus is unlikely to change frequently, but is queried often (on every message sent to a campus).
     * - Querying the database every time would be inefficient and could lead to performance bottlenecks under high load.
     * - An in-memory cache (campusAdminsCache) is used to store the mapping from campusId to campus admin user IDs, reducing database reads and improving response times.
     *
     * Cache invalidation:
     * - The cache should be invalidated (using invalidateCampusAdminsCache) whenever campus admins are added or removed for a campus.
     * - This ensures that the cache does not serve stale data and always reflects the current set of campus admins.
     * - Cache invalidation can be triggered by admin management events or hooks in the user/campus admin management logic.
     *
     * Usage:
     * - This method should be used whenever the system needs to determine the recipients for campus-directed chat messages.
     * - It is safe to use the cache for read-heavy, write-light scenarios, but always ensure proper invalidation on admin changes.
     *
     * @param campusId - The ObjectId of the campus whose admin user IDs are to be retrieved.
     * @param useCache - Whether to use the cache (default: true).
     * @returns Promise<string[]> - Array of campus admin user IDs as strings.
     */

    private readonly campusAdminCacheService: CampusAdminCacheService,
  ) {}

  async createConversation(
    createConversationDto: CreateConversationDto,
    userId: string,
  ): Promise<Conversation> {
    try {
      // Validate IDs
      if (!Types.ObjectId.isValid(userId)) {
        throw new BadRequestException(`Invalid user ID: ${userId}`);
      }

      if (!Types.ObjectId.isValid(createConversationDto.campus_id)) {
        throw new BadRequestException(
          `Invalid campus ID: ${createConversationDto.campus_id}`,
        );
      }

      // Check if conversation already exists
      const existingConversation = await this.conversationModel.findOne({
        user_id: new Types.ObjectId(userId),
        campus_id: new Types.ObjectId(createConversationDto.campus_id),
        is_active: true,
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
        is_active: true,
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
          campus_id: new Types.ObjectId(createConversationDto.campus_id),
        });

        if (existingConversation) {
          return existingConversation;
        }

        throw new BadRequestException(
          'Conversation already exists between this user and campus',
        );
      }

      if (error.message.includes('hex string must be 24 characters')) {
        throw new BadRequestException(
          'Invalid ID format. IDs must be valid MongoDB ObjectIds.',
        );
      }

      throw error;
    }
  }

  async findAllConversationsForUser(userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException(`Invalid user ID: ${userId}`);
    }

    return this.conversationModel
      .find({
        user_id: new Types.ObjectId(userId),
        is_active: true,
      })
      .populate({
        path: 'user_id',
        select: '_id first_name last_name email user_type',
      })
      .populate('campus_id')
      .sort({ last_message_time: -1 })
      .exec();
  }

  async findAllConversationsForCampus(campusId: string) {
    if (!Types.ObjectId.isValid(campusId)) {
      throw new BadRequestException(`Invalid campus ID: ${campusId}`);
    }

    return this.conversationModel
      .find({
        campus_id: new Types.ObjectId(campusId),
        is_active: true,
      })
      .populate({
        path: 'user_id',
        select: '_id first_name last_name email user_type',
      })
      .populate('campus_id')
      .sort({ last_message_time: -1 })
      .exec();
  }

  async findConversation(id: string): Promise<PopulatedConversationAll> {
    const conversation = await this.conversationModel
      .findById(id)
      .populate('user_id')
      .populate('campus_id')
      .exec();

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (!isPopulatedAll(conversation)) {
      throw new Error('Conversation is not fully populated');
    }

    return conversation;
  }

  async updateConversation(
    id: string,
    updateConversationDto: UpdateConversationDto,
  ) {
    const conversation = await this.conversationModel.findByIdAndUpdate(
      id,
      updateConversationDto,
      { new: true },
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
      { new: true },
    );
  }

  async markConversationAsReadByCampus(id: string) {
    return await this.conversationModel.findByIdAndUpdate(
      id,
      { is_read_by_campus: true },
      { new: true },
    );
  }

  async deleteConversation(id: string) {
    // Soft delete by setting is_active to false
    const conversation = await this.conversationModel.findByIdAndUpdate(
      id,
      { is_active: false },
      { new: true },
    );

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return { message: 'Conversation deleted successfully' };
  }

  private async handleMessageCreation(
    createMessageDto: CreateMessageDto,
    userId: string,
    senderType: ConversationParticipantType,
    curMsgTime: Date,
    conversationId: Types.ObjectId,
    senderId: Types.ObjectId,
    sessionResult: Awaited<
      ReturnType<typeof this.chatSessionService.handleChatSession>
    >,
  ) {
    // Create message object
    let messageData: Partial<MessageDocument> = {
      conversation_id: conversationId,
      sender_id: senderId,
      sender_type: senderType,
      sender_type_ref:
        senderType === ConversationParticipantType.USER ? 'User' : 'Campus',
      content: createMessageDto.content,
      is_read_by_user: senderType === ConversationParticipantType.USER,
      is_read_by_campus: senderType === ConversationParticipantType.CAMPUS,
      attachments: createMessageDto.attachments || [],
      created_at: curMsgTime,
      sessionId: sessionResult.sessionId,
    };

    // If the message is sent by the campus, then keep a track of which user replied on behalf of the campus
    if (senderType === ConversationParticipantType.CAMPUS) {
      messageData.replied_by_user_id = new Types.ObjectId(userId);
    }

    // Create new message
    const newMessage = new this.messageModel(messageData);
    const savedMessage = await newMessage.save();

    return {
      savedMessage,
      sessionResult,
    };
  }

  /**
   * Creates a new chat message in a conversation.
   *
   * This method handles the following:
   * - Validates the conversation ID and user permissions.
   * - Ensures the sender is a participant in the conversation (student or campus admin).
   * - Determines the correct sender and recipient IDs based on sender type.
   * - Fetches campus admin IDs from cache if the recipient is a campus.
   * - Throws appropriate errors if validation fails.
   * - Proceeds to session handling and message creation.
   *
   * @param createMessageDto - DTO containing message content and conversation ID
   * @param user - Authenticated user sending the message
   * @param senderType - Type of sender (USER or CAMPUS)
   * @returns The created Message document
   */
  async createMessage(
    createMessageDto: CreateMessageDto,
    user: AuthenticatedRequest['user'],
    senderType: ConversationParticipantType,
  ): Promise<Message> {
    try {
      const userId = user.sub;

      // Validate the provided conversation ID
      if (!Types.ObjectId.isValid(createMessageDto.conversation_id)) {
        throw new BadRequestException(
          `Invalid conversation ID: ${createMessageDto.conversation_id}`,
        );
      }

      // Convert IDs to ObjectId for MongoDB operations
      const userObjectId = new Types.ObjectId(userId);
      const conversationId = createMessageDto.conversation_id;
      const conversationObjectId = new Types.ObjectId(conversationId);

      // Retrieve the current conversation from the database
      const currentConversation =
        await this.conversationModel.findById(conversationObjectId);
      if (!currentConversation) {
        throw new NotFoundException(
          `Conversation with ID ${createMessageDto.conversation_id} not found`,
        );
      }

      // Permission check: Ensure the sender is a participant in the conversation
      if (senderType === ConversationParticipantType.USER) {
        // If sender is a student, they must match the user_id in the conversation
        const isUserParticipant =
          currentConversation.user_id.equals(userObjectId);
        if (!isUserParticipant) {
          this.logger.debug(
            `User with ID ${userId} is not a participant in conversation with ID ${conversationObjectId}`,
          );
          throw new NotFoundException(
            `You do not have permission to send messages to this conversation because you are not a student participant in this conversation`,
          );
        }
      } else if (senderType === ConversationParticipantType.CAMPUS) {
        // If sender is a campus admin, they must have a campus assigned and match the campus_id in the conversation
        const userCampusId = user.campus_id;
        if (!userCampusId) {
          this.logger.error(
            `User with ID ${userId} does not have a campus assigned to them`, // This should not happen as the user should have a campus assigned to them if they are a campus admin
          );
          throw new NotFoundException(
            `You do not have permission to send messages to this conversation because you are not a campus admin participant in this conversation`,
          );
        }

        const isCampusParticipant =
          currentConversation.campus_id.equals(userCampusId);

        if (!isCampusParticipant) {
          this.logger.debug(
            `Campus with ID ${userId} is not a participant in conversation with ID ${conversationObjectId}`,
          );
          throw new NotFoundException(
            `You do not have permission to send messages to this conversation because you are not a participant in this conversation`,
          );
        }
      }

      // Determine sender and recipient IDs based on sender type
      let senderId: Types.ObjectId;
      let recipientIds: string[];
      if (senderType === ConversationParticipantType.USER) {
        // If the sender is a user, set senderId to the user's ObjectId
        senderId = userObjectId;
        const recipientCampusId = currentConversation.campus_id;
        // Fetch campus admin IDs for the campus (using cache for efficiency)
        const recipientCampusAdminIds =
          await this.campusAdminCacheService.getCampusAdminIdsForCampus(
            recipientCampusId,
          );
        if (recipientCampusAdminIds.length === 0) {
          throw new NotFoundException(
            `No campus admins found for campus with ID ${recipientCampusId}`,
          );
        }
        recipientIds = recipientCampusAdminIds;
        // Log the recipient admin IDs for debugging
        console.log(
          '🚀 ~ ChatService ~ User sending message to Campus Admins:',
          recipientIds,
        );
      } else {
        // If the sender is a campus admin, set senderId to the campus's ObjectId
        senderId = currentConversation.campus_id;
        // The recipient is the user in the conversation
        recipientIds = [currentConversation.user_id.toString()];
      }

      // Get the current timestamp for the message
      const curMsgTime = new Date();

      // Handle chat session logic (e.g., session validity, response time updates)
      const sessionResult = await this.chatSessionService.handleChatSession({
        conversation: currentConversation,
        senderType,
        curMsgTime,
        conversationId: conversationObjectId,
      });

      // TODO: Use a DB Transaction around all db updates and socket messages
      // Create the message in db and handle the session logic
      const { savedMessage } = await this.handleMessageCreation(
        createMessageDto,
        userId,
        senderType,
        curMsgTime,
        conversationObjectId,
        senderId,
        sessionResult,
      );

      // Update conversation with last message info and session updates
      await this.conversationModel.findByIdAndUpdate(conversationObjectId, {
        last_message: createMessageDto.content,
        last_message_time: curMsgTime,
        last_message_sender: senderType,
        is_read_by_user: senderType === ConversationParticipantType.USER,
        is_read_by_campus: senderType === ConversationParticipantType.CAMPUS,
        ...sessionResult.conversationDocUpdate,
      });
      this.logger.debug('🍎 Conversation updated');

      // TODO: Get the message recipients

      // If recipient is a campus, then send the message notification to all the admins of the campus
      // - they should be listening to the `chat/notification/message` event (as expected)
      // - if no campus admin is found active, then do nothing

      // If recipient is a user, then send the message notification to the user
      // - they should be listening to the `chat/notification/message` event (as expected)
      // - if no user is found active, then do nothing

      // TODO: Get the message recipients
      // This should decide if the message notification to the user against this speicific message based on the user's active conversation and conversationId
      // ! BUG: notificaiton should only be emitted to recipients (excludes the sender)
      // ! BUG: notification should only be emitted to recipients who are not in the conversation room
      this.chatGateway.emitMessageNotificationToRecipients(
        recipientIds,
        savedMessage,
      );
      this.logger.debug('🍎 Message notification emitted');

      // Then emit the event with the saved message
      // TODO: Restrict sending the message to the sender
      this.chatGateway.emitChatMessageToConversation(
        userId,
        createMessageDto.conversation_id,
        savedMessage,
      );
      this.logger.debug('🍎 Message emitted');

      return savedMessage;
    } catch (error) {
      console.log('🚀 ~ ChatService ~ error:', error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      if (error.message.includes('hex string must be 24 characters')) {
        throw new BadRequestException(
          'Invalid ID format. IDs must be valid MongoDB ObjectIds.',
        );
      }
      throw error;
    }
  }

  async getMessagesByConversation(
    conversationId: string,
    page: number = 1,
    limit: number = 20,
  ) {
    try {
      // Validate conversationId
      if (!Types.ObjectId.isValid(conversationId)) {
        throw new BadRequestException(
          `Invalid conversation ID: ${conversationId}`,
        );
      }

      const skip = (page - 1) * limit;

      // Find the conversation to verify it exists
      const conversation = await this.conversationModel.findById(
        new Types.ObjectId(conversationId),
      );

      if (!conversation) {
        throw new NotFoundException(
          `Conversation with ID ${conversationId} not found`,
        );
      }

      // Get messages
      const [messages, total] = await Promise.all([
        this.messageModel
          .find({
            conversation_id: new Types.ObjectId(conversationId),
          })
          .sort({ created_at: -1 })
          .skip(skip)
          .limit(limit)
          .exec(),
        this.messageModel.countDocuments({
          conversation_id: new Types.ObjectId(conversationId),
        }),
      ]);

      // Manually populate sender details based on sender_type
      const populatedMessages = await Promise.all(
        messages.map(async (message) => {
          const messageObj = message.toObject();

          try {
            if (messageObj.sender_type === 'user') {
              // Populate from User model
              const user = await this.userModel
                .findById(messageObj.sender_id)
                .select('first_name last_name email profile_image user_type')
                .exec();

              if (user) {
                messageObj.sender = user.toObject();
              }
            } else if (messageObj.sender_type === 'campus') {
              // Populate from Campus model
              const campus = await this.campusModel
                .findById(messageObj.sender_id)
                .select('name logo_url contact_email contact_phone')
                .exec();

              if (campus) {
                messageObj.sender = campus.toObject();

                // Also populate the user who replied on behalf of the campus
                if (messageObj.replied_by_user_id) {
                  const repliedByUser = await this.userModel
                    .findById(messageObj.replied_by_user_id)
                    .select('first_name last_name email user_type')
                    .exec();

                  if (repliedByUser) {
                    messageObj.replied_by_user = repliedByUser.toObject();
                  }
                }
              }
            }
          } catch (error) {
            console.error(
              `Error populating sender for message ${messageObj._id}:`,
              error,
            );
          }

          return messageObj;
        }),
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
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      if (error.message.includes('hex string must be 24 characters')) {
        throw new BadRequestException(
          'Invalid conversation ID format. Must be a valid MongoDB ObjectId.',
        );
      }
      throw error;
    }
  }

  async markMessagesAsRead(
    conversationId: string,
    userType: 'user' | 'campus',
  ) {
    try {
      // Validate conversationId
      if (!Types.ObjectId.isValid(conversationId)) {
        throw new BadRequestException(
          `Invalid conversation ID: ${conversationId}`,
        );
      }

      // Mark all messages from the other party as read
      const senderType =
        userType === ConversationParticipantType.USER
          ? ConversationParticipantType.CAMPUS
          : ConversationParticipantType.USER;
      const readField =
        userType === ConversationParticipantType.USER
          ? 'is_read_by_user'
          : 'is_read_by_campus';

      await this.messageModel.updateMany(
        {
          conversation_id: new Types.ObjectId(conversationId),
          sender_type: senderType,
          [readField]: false,
        },
        { [readField]: true },
      );

      // Update conversation read status
      const updateField =
        userType === 'user'
          ? { is_read_by_user: true }
          : { is_read_by_campus: true };

      await this.conversationModel.findByIdAndUpdate(
        conversationId,
        updateField,
      );

      return { message: 'Messages marked as read' };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      if (error.message.includes('hex string must be 24 characters')) {
        throw new BadRequestException(
          'Invalid conversation ID format. Must be a valid MongoDB ObjectId.',
        );
      }
      throw error;
    }
  }
}
