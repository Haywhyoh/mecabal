import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query, 
  UseGuards, 
  Req,
  HttpCode,
  HttpStatus,
  Request,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  UnauthorizedException
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiParam, 
  ApiQuery,
  ApiBearerAuth,
  ApiBody
} from '@nestjs/swagger';
import { MessagingServiceService } from './messaging-service.service';
import { 
  CreateConversationDto, 
  SendMessageDto, 
  GetConversationsDto, 
  GetMessagesDto,
  MarkAsReadDto,
  TypingIndicatorDto,
  UpdateMessageDto,
  ConversationResponseDto,
  MessageResponseDto,
  PaginatedResponseDto,
  ApiResponseDto
} from './dto';

@ApiBearerAuth()
@ApiTags('messaging')
@Controller()
export class MessagingServiceController {
  constructor(
    private readonly messagingServiceService: MessagingServiceService,
    private readonly jwtService: JwtService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get service status' })
  @ApiResponse({ status: 200, description: 'Service is running' })
  getHello(): string {
    return this.messagingServiceService.getHello();
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Service health status' })
  async getHealth() {
    return this.messagingServiceService.getHealthStatus();
  }

  // ========== CONVERSATION ENDPOINTS ==========

  @Get('conversations')
  @ApiOperation({ summary: 'Get user conversations' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of user conversations',
    type: PaginatedResponseDto<ConversationResponseDto>
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiQuery({ name: 'type', required: false, enum: ['direct', 'group', 'community'], description: 'Conversation type' })
  @ApiQuery({ name: 'contextType', required: false, enum: ['event', 'business', 'listing', 'general'], description: 'Context type' })
  @ApiQuery({ name: 'isArchived', required: false, type: Boolean, description: 'Filter archived conversations' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search term' })
  async getConversations(
    @Req() req: any,
    @Query() query: GetConversationsDto,
  ): Promise<PaginatedResponseDto<ConversationResponseDto>> {
    const userId = this.extractUserIdFromRequest(req);
    return this.messagingServiceService.getUserConversations(userId, query);
  }

  @Get('conversations/:id')
  @ApiOperation({ summary: 'Get specific conversation' })
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Conversation details',
    type: ConversationResponseDto
  })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async getConversation(
    @Req() req: any,
    @Param('id') conversationId: string,
  ): Promise<ConversationResponseDto> {
    const userId = this.extractUserIdFromRequest(req);
    return this.messagingServiceService.getConversation(conversationId, userId);
  }

  @Post('conversations')
  @ApiOperation({ summary: 'Create new conversation' })
  @ApiBody({ type: CreateConversationDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Conversation created successfully',
    type: ConversationResponseDto
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async createConversation(
    @Req() req: any,
    @Body() dto: CreateConversationDto,
  ): Promise<ConversationResponseDto> {
    const userId = this.extractUserIdFromRequest(req);
    return this.messagingServiceService.createConversation(userId, dto);
  }

  @Post('conversations/:id/archive')
  @ApiOperation({ summary: 'Archive conversation' })
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  @ApiResponse({ status: 200, description: 'Conversation archived successfully' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async archiveConversation(
    @Req() req: any,
    @Param('id') conversationId: string,
  ): Promise<{ success: boolean }> {
    const userId = this.extractUserIdFromRequest(req);
    return this.messagingServiceService.archiveConversation(conversationId, userId);
  }

  @Post('conversations/:id/pin')
  @ApiOperation({ summary: 'Pin/unpin conversation' })
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  @ApiResponse({ status: 200, description: 'Conversation pin status updated' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  async pinConversation(
    @Req() req: any,
    @Param('id') conversationId: string,
  ): Promise<{ success: boolean }> {
    const userId = this.extractUserIdFromRequest(req);
    return this.messagingServiceService.pinConversation(conversationId, userId);
  }

  // ========== MESSAGE ENDPOINTS ==========

  @Get('conversations/:id/messages')
  @ApiOperation({ summary: 'Get conversation messages' })
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Messages per page' })
  @ApiQuery({ name: 'beforeMessageId', required: false, type: String, description: 'Message ID to start from' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of messages',
    type: PaginatedResponseDto<MessageResponseDto>
  })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async getMessages(
    @Req() req: any,
    @Param('id') conversationId: string,
    @Query() query: GetMessagesDto,
  ): Promise<PaginatedResponseDto<MessageResponseDto>> {
    const userId = this.extractUserIdFromRequest(req);
    return this.messagingServiceService.getMessages(conversationId, userId, query);
  }

  @Post('messages')
  @ApiOperation({ summary: 'Send message' })
  @ApiBody({ type: SendMessageDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Message sent successfully',
    type: MessageResponseDto
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async sendMessage(
    @Req() req: any,
    @Body() dto: SendMessageDto,
  ): Promise<MessageResponseDto> {
    const userId = this.extractUserIdFromRequest(req);
    return this.messagingServiceService.sendMessage(userId, dto);
  }

  @Put('messages/:id')
  @ApiOperation({ summary: 'Edit message' })
  @ApiParam({ name: 'id', description: 'Message ID' })
  @ApiBody({ type: UpdateMessageDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Message edited successfully',
    type: MessageResponseDto
  })
  @ApiResponse({ status: 404, description: 'Message not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async editMessage(
    @Req() req: any,
    @Param('id') messageId: string,
    @Body() dto: UpdateMessageDto,
  ): Promise<MessageResponseDto> {
    const userId = this.extractUserIdFromRequest(req);
    return this.messagingServiceService.editMessage(messageId, userId, dto.content);
  }

  @Delete('messages/:id')
  @ApiOperation({ summary: 'Delete message' })
  @ApiParam({ name: 'id', description: 'Message ID' })
  @ApiResponse({ status: 200, description: 'Message deleted successfully' })
  @ApiResponse({ status: 404, description: 'Message not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @HttpCode(HttpStatus.OK)
  async deleteMessage(
    @Req() req: any,
    @Param('id') messageId: string,
  ): Promise<{ success: boolean }> {
    const userId = this.extractUserIdFromRequest(req);
    return this.messagingServiceService.deleteMessage(messageId, userId);
  }

  @Post('conversations/:id/mark-read')
  @ApiOperation({ summary: 'Mark conversation as read' })
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  @ApiBody({ type: MarkAsReadDto })
  @ApiResponse({ status: 200, description: 'Messages marked as read' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async markAsRead(
    @Req() req: any,
    @Param('id') conversationId: string,
    @Body() dto: MarkAsReadDto,
  ): Promise<{ success: boolean }> {
    const userId = this.extractUserIdFromRequest(req);
    return this.messagingServiceService.markAsRead(conversationId, userId, dto.messageId);
  }

  // ========== TYPING INDICATORS ==========

  @Post('typing')
  @ApiOperation({ summary: 'Update typing indicator' })
  @ApiBody({ type: TypingIndicatorDto })
  @ApiResponse({ status: 200, description: 'Typing indicator updated' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async updateTypingIndicator(
    @Req() req: any,
    @Body() dto: TypingIndicatorDto,
  ): Promise<{ success: boolean }> {
    const userId = this.extractUserIdFromRequest(req);
    return this.messagingServiceService.updateTypingIndicator(userId, dto);
  }

  // ========== CONTEXT-BASED CONVERSATIONS ==========

  @Get('conversations/event/:eventId')
  @ApiOperation({ summary: 'Get or create event conversation' })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  @ApiQuery({ name: 'organizerId', description: 'Event organizer ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Event conversation',
    type: ConversationResponseDto
  })
  async getOrCreateEventConversation(
    @Req() req: any,
    @Param('eventId') eventId: string,
    @Query('organizerId') organizerId: string,
  ): Promise<ConversationResponseDto> {
    const userId = this.extractUserIdFromRequest(req);
    return this.messagingServiceService.createConversation(userId, {
      type: 'direct' as any,
      participantIds: [organizerId],
      contextType: 'event' as any,
      contextId: eventId,
      title: `Event Discussion`,
    });
  }

  @Get('conversations/business/:businessId')
  @ApiOperation({ summary: 'Get or create business conversation' })
  @ApiParam({ name: 'businessId', description: 'Business ID' })
  @ApiQuery({ name: 'ownerId', description: 'Business owner ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Business conversation',
    type: ConversationResponseDto
  })
  async getOrCreateBusinessConversation(
    @Req() req: any,
    @Param('businessId') businessId: string,
    @Query('ownerId') ownerId?: string,
  ): Promise<ConversationResponseDto> {
    const userId = this.extractUserIdFromRequest(req);
    
    // If ownerId is not provided, we need to fetch it from the business service
    // For now, we'll require it to be provided, but we should fetch it from business service
    if (!ownerId) {
      throw new UnauthorizedException('Business owner ID is required. Please provide ownerId query parameter.');
    }
    
    return this.messagingServiceService.createConversation(userId, {
      type: 'direct' as any,
      participantIds: [ownerId],
      contextType: 'business' as any,
      contextId: businessId,
      title: `Business Inquiry`,
    });
  }

  // ========== FILE UPLOAD ENDPOINTS ==========

  @Post('conversations/:conversationId/attachments')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload a single file attachment to conversation' })
  @ApiParam({ name: 'conversationId', description: 'Conversation ID' })
  @ApiResponse({
    status: 201,
    description: 'File uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            url: { type: 'string' },
            key: { type: 'string' },
            size: { type: 'number' },
            mimeType: { type: 'string' },
            bucket: { type: 'string' },
          },
        },
      },
    },
  })
  async uploadAttachment(
    @Param('conversationId') conversationId: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    const userId = this.extractUserIdFromRequest(req);
    
    if (!file) {
      return {
        success: false,
        error: 'No file provided',
      };
    }

    const mediaFile = {
      buffer: file.buffer,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    };

    const result = await this.messagingServiceService.uploadAttachment(
      mediaFile,
      userId,
      conversationId,
    );

    return {
      success: true,
      data: result,
    };
  }

  @Post('conversations/:conversationId/attachments/multiple')
  @UseInterceptors(FilesInterceptor('files', 10)) // Max 10 files
  @ApiOperation({ summary: 'Upload multiple file attachments to conversation' })
  @ApiParam({ name: 'conversationId', description: 'Conversation ID' })
  @ApiResponse({
    status: 201,
    description: 'Files uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              url: { type: 'string' },
              key: { type: 'string' },
              size: { type: 'number' },
              mimeType: { type: 'string' },
              bucket: { type: 'string' },
            },
          },
        },
      },
    },
  })
  async uploadAttachments(
    @Param('conversationId') conversationId: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: any,
  ) {
    const userId = this.extractUserIdFromRequest(req);
    
    if (!files || files.length === 0) {
      return {
        success: false,
        error: 'No files provided',
      };
    }

    const mediaFiles = files.map(file => ({
      buffer: file.buffer,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    }));

    const results = await this.messagingServiceService.uploadAttachments(
      mediaFiles,
      userId,
      conversationId,
    );

    return {
      success: true,
      data: results,
    };
  }

  @Delete('attachments/:fileKey')
  @ApiOperation({ summary: 'Delete a file attachment' })
  @ApiParam({ name: 'fileKey', description: 'File key to delete' })
  @ApiResponse({
    status: 200,
    description: 'File deleted successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  })
  async deleteAttachment(
    @Param('fileKey') fileKey: string,
    @Req() req: any,
  ) {
    const userId = this.extractUserIdFromRequest(req);
    
    const deleted = await this.messagingServiceService.deleteAttachment(fileKey, userId);
    
    return {
      success: deleted,
      message: deleted ? 'File deleted successfully' : 'Failed to delete file',
    };
  }

  @Get('attachments/:fileKey/url')
  @ApiOperation({ summary: 'Get file URL with optional expiration' })
  @ApiParam({ name: 'fileKey', description: 'File key' })
  @ApiQuery({ name: 'expiresIn', required: false, type: Number, description: 'Expiration time in seconds' })
  @ApiResponse({
    status: 200,
    description: 'File URL generated successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            url: { type: 'string' },
          },
        },
      },
    },
  })
  async getAttachmentUrl(
    @Param('fileKey') fileKey: string,
    @Query('expiresIn') expiresIn?: number,
  ) {
    const url = await this.messagingServiceService.getAttachmentUrl(fileKey, expiresIn);
    
    return {
      success: true,
      data: { url },
    };
  }

  @Get('attachments/:fileKey/exists')
  @ApiOperation({ summary: 'Check if file exists' })
  @ApiParam({ name: 'fileKey', description: 'File key to check' })
  @ApiResponse({
    status: 200,
    description: 'File existence checked',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            exists: { type: 'boolean' },
          },
        },
      },
    },
  })
  async checkAttachmentExists(@Param('fileKey') fileKey: string) {
    const exists = await this.messagingServiceService.attachmentExists(fileKey);
    
    return {
      success: true,
      data: { exists },
    };
  }

  // ========== UTILITY METHODS ==========

  private extractUserIdFromRequest(req: any): string {
    try {
      // Extract token from Authorization header
      const authHeader = req.headers?.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedException('No valid authorization header');
      }

      const token = authHeader.split(' ')[1];
      if (!token) {
        throw new UnauthorizedException('No token provided');
      }

      // Verify and decode the JWT token
      // Use JWT_SECRET (same as auth service) or fallback to JWT_ACCESS_SECRET
      const jwtSecret = process.env.JWT_SECRET || process.env.JWT_ACCESS_SECRET || 'your-secret-key';
      const payload = this.jwtService.verify(token, {
        secret: jwtSecret,
      });

      // Extract user ID from token payload
      const userId = payload.sub || payload.userId || payload.id;
      if (!userId) {
        throw new UnauthorizedException('No user ID in token');
      }

      return userId;
    } catch (error) {
      // Don't use mock user ID - it causes foreign key constraint violations
      // Instead, throw proper error so the client knows authentication failed
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      
      throw new UnauthorizedException(`Invalid token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
