import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, FindManyOptions, FindOptionsWhere } from 'typeorm';
import { FileUploadService } from '@app/storage';
import { MediaFile, UploadResult } from '@app/storage';
import { User } from '@app/database';
import { 
  Conversation, 
  ConversationType, 
  ContextType,
  ConversationParticipant,
  Message,
  MessageType,
  MessageReceipt,
  ReceiptStatus,
  TypingIndicator
} from './entities';
import { 
  CreateConversationDto, 
  SendMessageDto, 
  GetConversationsDto, 
  GetMessagesDto,
  MarkAsReadDto,
  TypingIndicatorDto,
  ConversationResponseDto,
  MessageResponseDto,
  PaginatedResponseDto,
  ApiResponseDto
} from './dto';

@Injectable()
export class MessagingServiceService {
  constructor(
    @InjectRepository(Conversation)
    private conversationRepository: Repository<Conversation>,
    @InjectRepository(ConversationParticipant)
    private participantRepository: Repository<ConversationParticipant>,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(MessageReceipt)
    private receiptRepository: Repository<MessageReceipt>,
    @InjectRepository(TypingIndicator)
    private typingRepository: Repository<TypingIndicator>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private fileUploadService: FileUploadService,
  ) {}

  getHello(): string {
    return 'Messaging Service is running!';
  }

  // Basic health check
  async getHealthStatus() {
    return {
      status: 'healthy',
      timestamp: new Date(),
      service: 'messaging-service',
      version: '1.0.0',
    };
  }

  // ========== CONVERSATION METHODS ==========

  async getUserConversations(userId: string, query: GetConversationsDto): Promise<PaginatedResponseDto<ConversationResponseDto>> {
    const { page = 1, limit = 20, type, contextType, isArchived = false, search } = query;
    const skip = (page - 1) * limit;

    // Build where conditions
    const whereConditions: FindOptionsWhere<Conversation> = {
      isArchived,
    };

    if (type) whereConditions.type = type;
    if (contextType) whereConditions.contextType = contextType;

    // Get user's conversation IDs
    const userConversations = await this.participantRepository.find({
      where: { userId, leftAt: undefined },
      select: ['conversationId'],
    });

    const conversationIds = userConversations.map(uc => uc.conversationId);

    if (conversationIds.length === 0) {
      return {
        data: [],
        meta: {
          page,
          limit,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
      };
    }

    whereConditions.id = In(conversationIds);

    // Add search condition
    if (search) {
      whereConditions.title = search as any; // This will be handled by the query builder
    }

    const [conversations, total] = await this.conversationRepository.findAndCount({
      where: whereConditions,
      relations: ['participants', 'participants.user', 'messages'],
      order: { lastMessageAt: 'DESC', updatedAt: 'DESC' },
      skip,
      take: limit,
    });

    const conversationResponses = await Promise.all(
      conversations.map(conv => this.mapConversationToResponse(conv, userId))
    );

    return {
      data: conversationResponses,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }

  async getConversation(conversationId: string, userId: string): Promise<ConversationResponseDto> {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
      relations: ['participants', 'participants.user', 'messages'],
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Check if user is a participant
    const isParticipant = conversation.participants.some(p => p.userId === userId && !p.leftAt);
    if (!isParticipant) {
      throw new ForbiddenException('You are not a participant in this conversation');
    }

    return this.mapConversationToResponse(conversation, userId);
  }

  async createConversation(userId: string, dto: CreateConversationDto): Promise<ConversationResponseDto> {
    const { participantIds, type, title, description, contextType, contextId, isArchived } = dto;

    // Validate that the creator (userId) exists in the database
    const creator = await this.userRepository.findOne({ where: { id: userId } });
    if (!creator) {
      throw new NotFoundException(`User with ID ${userId} not found. Cannot create conversation.`);
    }

    // Validate participants
    if (participantIds.length < 1) {
      throw new BadRequestException('At least one participant is required');
    }

    if (type === ConversationType.DIRECT && participantIds.length !== 1) {
      throw new BadRequestException('Direct conversations must have exactly one other participant');
    }

    // Validate that all participants exist
    const participantUsers = await this.userRepository.find({
      where: { id: In(participantIds) },
    });
    
    if (participantUsers.length !== participantIds.length) {
      const foundIds = participantUsers.map(p => p.id);
      const missingIds = participantIds.filter(id => !foundIds.includes(id));
      throw new NotFoundException(`One or more participants not found: ${missingIds.join(', ')}`);
    }

    // Check if direct conversation already exists
    if (type === ConversationType.DIRECT) {
      const existingConversation = await this.findDirectConversation(userId, participantIds[0]);
      if (existingConversation) {
        return this.mapConversationToResponse(existingConversation, userId);
      }
    }

    // Create conversation
    const conversation = this.conversationRepository.create({
      type,
      title,
      description,
      contextType,
      contextId,
      isArchived: isArchived || false,
      creatorId: userId,
    });

    const savedConversation = await this.conversationRepository.save(conversation);

    // Add participants
    const participants = [
      { conversationId: savedConversation.id, userId, role: 'admin' as any },
      ...participantIds.map(participantId => ({
        conversationId: savedConversation.id,
        userId: participantId,
        role: 'member' as any,
      })),
    ];

    await this.participantRepository.save(participants);

    // Reload with relations
    const fullConversation = await this.conversationRepository.findOne({
      where: { id: savedConversation.id },
      relations: ['participants', 'participants.user', 'messages'],
    });

    return this.mapConversationToResponse(fullConversation!, userId);
  }

  async archiveConversation(conversationId: string, userId: string): Promise<{ success: boolean }> {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
      relations: ['participants'],
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const isParticipant = conversation.participants.some(p => p.userId === userId && !p.leftAt);
    if (!isParticipant) {
      throw new ForbiddenException('You are not a participant in this conversation');
    }

    await this.conversationRepository.update(conversationId, { isArchived: true });

    return { success: true };
  }

  async pinConversation(conversationId: string, userId: string): Promise<{ success: boolean }> {
    const participant = await this.participantRepository.findOne({
      where: { conversationId, userId, leftAt: undefined },
    });

    if (!participant) {
      throw new NotFoundException('You are not a participant in this conversation');
    }

    await this.participantRepository.update(
      { conversationId, userId },
      { isPinned: !participant.isPinned }
    );

    return { success: true };
  }

  // ========== MESSAGE METHODS ==========

  async getMessages(conversationId: string, userId: string, query: GetMessagesDto): Promise<PaginatedResponseDto<MessageResponseDto>> {
    const { page = 1, limit = 50, beforeMessageId } = query;
    const skip = (page - 1) * limit;

    // Check if user is a participant
    const participant = await this.participantRepository.findOne({
      where: { conversationId, userId, leftAt: undefined },
    });

    if (!participant) {
      throw new ForbiddenException('You are not a participant in this conversation');
    }

    const whereConditions: FindOptionsWhere<Message> = {
      conversationId,
      isDeleted: false,
    };

    if (beforeMessageId) {
      const beforeMessage = await this.messageRepository.findOne({
        where: { id: beforeMessageId },
        select: ['createdAt'],
      });
      if (beforeMessage) {
        whereConditions.createdAt = beforeMessage.createdAt as any; // This will be handled by query builder
      }
    }

    const [messages, total] = await this.messageRepository.findAndCount({
      where: whereConditions,
      relations: ['sender', 'replyToMessage', 'replyToMessage.sender'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    const messageResponses = messages.map(msg => this.mapMessageToResponse(msg));

    return {
      data: messageResponses,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }

  async sendMessage(userId: string, dto: SendMessageDto): Promise<MessageResponseDto> {
    const { conversationId, content, type = MessageType.TEXT, replyToMessageId, metadata } = dto;

    // Check if user is a participant
    const participant = await this.participantRepository.findOne({
      where: { conversationId, userId, leftAt: undefined },
    });

    if (!participant) {
      throw new ForbiddenException('You are not a participant in this conversation');
    }

    // Validate reply to message
    if (replyToMessageId) {
      const replyToMessage = await this.messageRepository.findOne({
        where: { id: replyToMessageId, conversationId },
      });
      if (!replyToMessage) {
        throw new BadRequestException('Reply to message not found');
      }
    }

    // Create message
    const message = this.messageRepository.create({
      conversationId,
      senderId: userId,
      content,
      type,
      replyToMessageId,
      metadata,
    });

    const savedMessage = await this.messageRepository.save(message);

    // Update conversation last message time
    await this.conversationRepository.update(conversationId, {
      lastMessageAt: new Date(),
    });

    // Create receipts for all participants
    const participants = await this.participantRepository.find({
      where: { conversationId, leftAt: undefined },
      select: ['userId'],
    });

    const receipts = participants.map(p => ({
      messageId: savedMessage.id,
      userId: p.userId,
      status: p.userId === userId ? ReceiptStatus.SENT : ReceiptStatus.SENT,
    }));

    await this.receiptRepository.save(receipts);

    // Increment unread count for other participants
    await this.participantRepository.update(
      { conversationId, userId: In(participants.filter(p => p.userId !== userId).map(p => p.userId)) },
      { unreadCount: () => 'unread_count + 1' }
    );

    // Reload with relations
    const fullMessage = await this.messageRepository.findOne({
      where: { id: savedMessage.id },
      relations: ['sender', 'replyToMessage', 'replyToMessage.sender'],
    });

    return this.mapMessageToResponse(fullMessage!);
  }

  async editMessage(messageId: string, userId: string, content: string): Promise<MessageResponseDto> {
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
      relations: ['sender'],
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.senderId !== userId) {
      throw new ForbiddenException('You can only edit your own messages');
    }

    if (message.isDeleted) {
      throw new BadRequestException('Cannot edit deleted message');
    }

    message.edit(content);
    const updatedMessage = await this.messageRepository.save(message);

    // Reload with relations
    const fullMessage = await this.messageRepository.findOne({
      where: { id: messageId },
      relations: ['sender', 'replyToMessage', 'replyToMessage.sender'],
    });

    return this.mapMessageToResponse(fullMessage!);
  }

  async deleteMessage(messageId: string, userId: string): Promise<{ success: boolean }> {
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.senderId !== userId) {
      throw new ForbiddenException('You can only delete your own messages');
    }

    message.delete();
    await this.messageRepository.save(message);

    return { success: true };
  }

  async markAsRead(conversationId: string, userId: string, messageId?: string): Promise<{ success: boolean }> {
    const participant = await this.participantRepository.findOne({
      where: { conversationId, userId, leftAt: undefined },
    });

    if (!participant) {
      throw new ForbiddenException('You are not a participant in this conversation');
    }

    if (messageId) {
      // Mark specific message as read
      await this.receiptRepository.update(
        { messageId, userId },
        { status: ReceiptStatus.READ }
      );
    }

    // Reset unread count
    await this.participantRepository.update(
      { conversationId, userId },
      { 
        unreadCount: 0,
        lastReadAt: new Date(),
        lastReadMessageId: messageId,
      }
    );

    return { success: true };
  }

  // ========== TYPING INDICATORS ==========

  async updateTypingIndicator(userId: string, dto: TypingIndicatorDto): Promise<{ success: boolean }> {
    const { conversationId, isTyping } = dto;

    // Check if user is a participant
    const participant = await this.participantRepository.findOne({
      where: { conversationId, userId, leftAt: undefined },
    });

    if (!participant) {
      throw new ForbiddenException('You are not a participant in this conversation');
    }

    const existingIndicator = await this.typingRepository.findOne({
      where: { conversationId, userId },
    });

    if (existingIndicator) {
      if (isTyping) {
        existingIndicator.extendTyping();
      } else {
        existingIndicator.stopTyping();
      }
      await this.typingRepository.save(existingIndicator);
    } else if (isTyping) {
      const newIndicator = this.typingRepository.create({
        conversationId,
        userId,
        isTyping: true,
      });
      await this.typingRepository.save(newIndicator);
    }

    return { success: true };
  }

  // ========== HELPER METHODS ==========

  private async findDirectConversation(userId1: string, userId2: string): Promise<Conversation | null> {
    const conversations = await this.conversationRepository
      .createQueryBuilder('conversation')
      .innerJoin('conversation.participants', 'p1', 'p1.userId = :userId1 AND p1.leftAt IS NULL', { userId1 })
      .innerJoin('conversation.participants', 'p2', 'p2.userId = :userId2 AND p2.leftAt IS NULL', { userId2 })
      .where('conversation.type = :type', { type: ConversationType.DIRECT })
      .getMany();

    return conversations.length > 0 ? conversations[0] : null;
  }

  private async mapConversationToResponse(conversation: Conversation, userId: string): Promise<ConversationResponseDto> {
    const lastMessage = conversation.messages?.length > 0 
      ? conversation.messages.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]
      : null;

    return {
      id: conversation.id,
      type: conversation.type,
      title: conversation.title,
      description: conversation.description,
      avatarUrl: conversation.avatarUrl,
      contextType: conversation.contextType,
      contextId: conversation.contextId,
      isArchived: conversation.isArchived,
      creatorId: conversation.creatorId,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      lastMessageAt: conversation.lastMessageAt,
      participantCount: conversation.participants?.length || 0,
      messageCount: conversation.messages?.length || 0,
      lastMessage: lastMessage ? this.mapMessageToResponse(lastMessage) : undefined,
      participants: conversation.participants?.map(p => ({
        id: p.id,
        userId: p.userId,
        role: p.role,
        isMuted: p.isMuted,
        isPinned: p.isPinned,
        unreadCount: p.unreadCount,
        joinedAt: p.joinedAt,
        user: p.user ? {
          id: p.user.id,
          firstName: p.user.firstName,
          lastName: p.user.lastName,
          profilePictureUrl: p.user.profilePictureUrl,
        } : undefined,
      })) || [],
    };
  }

  private mapMessageToResponse(message: Message): MessageResponseDto {
    return {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      content: message.content,
      type: message.type,
      replyToMessageId: message.replyToMessageId,
      metadata: message.metadata,
      isEdited: message.isEdited,
      editedAt: message.editedAt,
      isDeleted: message.isDeleted,
      deletedAt: message.deletedAt,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
      sender: message.sender ? {
        id: message.sender.id,
        firstName: message.sender.firstName,
        lastName: message.sender.lastName,
        profilePictureUrl: message.sender.profilePictureUrl,
      } : undefined,
      replyToMessage: message.replyToMessage ? this.mapMessageToResponse(message.replyToMessage) : undefined,
    };
  }

  // ========== FILE UPLOAD METHODS ==========

  /**
   * Upload a single file attachment for messaging
   */
  async uploadAttachment(
    file: MediaFile,
    userId: string,
    conversationId: string,
    options?: { quality?: number; maxWidth?: number },
  ): Promise<UploadResult> {
    // Verify user has access to conversation
    const participant = await this.participantRepository.findOne({
      where: { conversationId, userId, leftAt: undefined },
    });

    if (!participant) {
      throw new ForbiddenException('You do not have access to this conversation');
    }

    return this.fileUploadService.uploadMessagingAttachment(
      file,
      userId,
      conversationId,
      options,
    );
  }

  /**
   * Upload multiple file attachments for messaging
   */
  async uploadAttachments(
    files: MediaFile[],
    userId: string,
    conversationId: string,
    options?: { quality?: number; maxWidth?: number },
  ): Promise<UploadResult[]> {
    // Verify user has access to conversation
    const participant = await this.participantRepository.findOne({
      where: { conversationId, userId, leftAt: undefined },
    });

    if (!participant) {
      throw new ForbiddenException('You do not have access to this conversation');
    }

    return this.fileUploadService.uploadMessagingAttachments(
      files,
      userId,
      conversationId,
      options,
    );
  }

  /**
   * Delete a file attachment
   */
  async deleteAttachment(fileKey: string, userId: string): Promise<boolean> {
    // TODO: Add authorization check to ensure user owns the file
    // For now, we'll allow deletion (in production, you'd want to verify ownership)
    return this.fileUploadService.deleteFile(fileKey);
  }

  /**
   * Get file URL with optional expiration
   */
  async getAttachmentUrl(fileKey: string, expiresIn?: number): Promise<string> {
    return this.fileUploadService.getFileUrl(fileKey, expiresIn);
  }

  /**
   * Check if file exists
   */
  async attachmentExists(fileKey: string): Promise<boolean> {
    return this.fileUploadService.fileExists(fileKey);
  }
}
