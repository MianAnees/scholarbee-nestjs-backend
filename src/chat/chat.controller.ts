import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    Req,
    Query,
    ForbiddenException,
    BadRequestException,
    NotFoundException,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { ResourceProtectionGuard } from '../auth/guards/resource-protection.guard';
import { ChatGateway } from './chat.gateway';

@Controller('chat')
@UseGuards(ResourceProtectionGuard)
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly chatGateway: ChatGateway,
  ) {}

  @Post('conversations')
  async createConversation(
    @Body() createConversationDto: CreateConversationDto,
    @Req() req,
  ) {
    try {
      // Get user ID from JWT token
      const userId = req.user.sub;

      return await this.chatService.createConversation(
        createConversationDto,
        userId,
      );
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(error.message);
    }
  }

  @Get('conversations/user')
  findAllConversationsForUser(@Req() req) {
    try {
      console.log(req.user);
      const userId = req.user.sub;

      // Validate userId
      if (!userId) {
        throw new BadRequestException('User ID not found in token');
      }

      return this.chatService.findAllConversationsForUser(userId);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(error.message);
    }
  }

  @Get('conversations/campus/:campusId')
  findAllConversationsForCampus(
    @Param('campusId') campusId: string,
    @Req() req: any,
  ) {
    // Here you would typically check if the user has admin rights for this campus
    // This is a placeholder for your authorization logic
    // const userId = req.user['sub'];
    // const userRole = req.user['role'];

    // if (userRole !== 'admin' && userRole !== 'campus_admin') {
    //     throw new ForbiddenException('You do not have permission to access these conversations');
    // }

    return this.chatService.findAllConversationsForCampus(campusId);
  }

  @Get('conversations/:id')
  findConversation(@Param('id') id: string) {
    return this.chatService.findConversation(id);
  }

  @Patch('conversations/:id')
  updateConversation(
    @Param('id') id: string,
    @Body() updateConversationDto: UpdateConversationDto,
  ) {
    return this.chatService.updateConversation(id, updateConversationDto);
  }

  @Patch('conversations/:id/read/user')
  markConversationAsReadByUser(@Param('id') id: string) {
    return this.chatService.markConversationAsReadByUser(id);
  }

  @Patch('conversations/:id/read/campus')
  markConversationAsReadByCampus(@Param('id') id: string) {
    return this.chatService.markConversationAsReadByCampus(id);
  }

  @Delete('conversations/:id')
  deleteConversation(@Param('id') id: string) {
    return this.chatService.deleteConversation(id);
  }

  @Post('messages/user')
  async createUserMessage(
    @Body() createMessageDto: CreateMessageDto,
    @Req() req,
  ) {
    try {
      const userId = req.user.sub;

      // Validate userId
      if (!userId) {
        throw new BadRequestException('User ID not found in token');
      }

      // Save message to database first
      const message = await this.chatService.createMessage(
        createMessageDto,
        userId,
        'user',
      );

      // Then emit the event with the saved message
      this.chatGateway.emitToConversation(
        createMessageDto.conversation_id,
        'newMessage',
        {
          message,
          conversationId: createMessageDto.conversation_id,
        },
      );

      return message;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(error.message);
    }
  }

  @Post('messages/campus')
  async createCampusMessage(
    @Body() createMessageDto: CreateMessageDto,
    @Req() req,
  ) {
    try {
      // Get user info from token
      const userId = req.user.sub;
      const userType = req.user.user_type;

      // Validate userId
      if (!userId) {
        throw new BadRequestException('User ID not found in token');
      }

      // // Check if user has admin rights
      // if (userType !== 'Admin' && userType !== 'Student') {
      //     throw new ForbiddenException('You do not have permission to send messages as campus');
      // }

      // Save message to database first
      const message = await this.chatService.createMessage(
        createMessageDto,
        userId,
        'campus',
      );

      // Then emit the event with the saved message
      this.chatGateway.emitToConversation(
        createMessageDto.conversation_id,
        'newMessage',
        {
          message,
          conversationId: createMessageDto.conversation_id,
        },
      );

      return message;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new BadRequestException(error.message);
    }
  }

  @Get('messages/:conversationId')
  getMessagesByConversation(
    @Param('conversationId') conversationId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.chatService.getMessagesByConversation(
      conversationId,
      page,
      limit,
    );
  }

  @Patch('messages/:conversationId/read/user')
  markMessagesAsReadByUser(@Param('conversationId') conversationId: string) {
    return this.chatService.markMessagesAsRead(conversationId, 'user');
  }

  @Patch('messages/:conversationId/read/campus')
  markMessagesAsReadByCampus(@Param('conversationId') conversationId: string) {
    return this.chatService.markMessagesAsRead(conversationId, 'campus');
  }
} 