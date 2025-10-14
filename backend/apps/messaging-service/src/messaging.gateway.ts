import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards, Logger } from '@nestjs/common';
import { MessagingServiceService } from './messaging-service.service';
import { SendMessageDto, TypingIndicatorDto } from './dto';

// Mock WebSocket JWT Guard - Replace with actual implementation
// @UseGuards(WsJwtGuard)
@WebSocketGateway({
  cors: {
    origin: process.env.WS_CORS_ORIGIN || '*',
    credentials: true,
  },
  namespace: '/messaging',
})
export class MessagingGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(MessagingGateway.name);
  private userSockets: Map<string, Set<string>> = new Map(); // userId -> Set<socketId>
  private socketUsers: Map<string, string> = new Map(); // socketId -> userId

  constructor(private readonly messagingService: MessagingServiceService) {}

  afterInit(server: Server) {
    this.logger.log('🚀 Messaging WebSocket Gateway initialized');
    
    // Clean up expired typing indicators every 30 seconds
    setInterval(async () => {
      await this.cleanupExpiredTypingIndicators();
    }, 30000);
  }

  async handleConnection(client: Socket) {
    try {
      // Extract user ID from auth token (implement proper JWT validation)
      const userId = this.extractUserIdFromSocket(client);
      
      if (!userId) {
        this.logger.warn(`❌ Connection rejected: No valid user ID`);
        client.disconnect();
        return;
      }

      // Add socket to user's socket set
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(client.id);
      this.socketUsers.set(client.id, userId);

      // Join user to their conversation rooms
      await this.joinUserConversations(client, userId);

      // Broadcast user online status
      this.broadcastUserStatus(userId, true);

      this.logger.log(`✅ User ${userId} connected (socket: ${client.id})`);
    } catch (error) {
      this.logger.error('Connection error:', error);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const userId = this.socketUsers.get(client.id);

    if (userId && this.userSockets.has(userId)) {
      const sockets = this.userSockets.get(userId)!;
      sockets.delete(client.id);

      // If no more sockets for this user, mark as offline
      if (sockets.size === 0) {
        this.userSockets.delete(userId);
        this.broadcastUserStatus(userId, false);
      }
    }

    this.socketUsers.delete(client.id);
    this.logger.log(`❌ User ${userId} disconnected (socket: ${client.id})`);
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: SendMessageDto,
  ) {
    const userId = this.socketUsers.get(client.id);
    
    if (!userId) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      // Send message via service
      const message = await this.messagingService.sendMessage(userId, data);

      // Get conversation participants for targeted broadcasting
      const conversation = await this.messagingService.getConversation(data.conversationId, userId);
      const participantIds = conversation.participants.map(p => p.userId);

      // Broadcast to conversation room
      this.server
        .to(`conversation:${data.conversationId}`)
        .emit('newMessage', {
          ...message,
          conversationId: data.conversationId,
          timestamp: new Date(),
        });

      // Update conversation in participants' lists
      this.server
        .to(`conversation:${data.conversationId}`)
        .emit('conversationUpdated', {
          conversationId: data.conversationId,
          lastMessage: message,
          updatedAt: new Date(),
          unreadCount: await this.getUnreadCounts(data.conversationId, participantIds),
        });

      // Send push notifications to offline users
      await this.sendPushNotifications(participantIds, {
        type: 'new_message',
        conversationId: data.conversationId,
        message: message,
        senderId: userId,
      });

      // Update message receipts
      this.server
        .to(`conversation:${data.conversationId}`)
        .emit('messageReceipts', {
          messageId: message.id,
          conversationId: data.conversationId,
          receipts: await this.getMessageReceipts(message.id),
          timestamp: new Date(),
        });

      // Broadcast to user's other devices
      this.broadcastToUserDevices(userId, 'messageSent', {
        messageId: message.id,
        conversationId: data.conversationId,
        status: 'sent',
      });

      return { success: true, message };
    } catch (error) {
      this.logger.error('Send message error:', error);
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('typing')
  async handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: TypingIndicatorDto,
  ) {
    const userId = this.socketUsers.get(client.id);
    
    if (!userId) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      await this.messagingService.updateTypingIndicator(userId, data);

      // Get conversation participants for targeted broadcasting
      const conversation = await this.messagingService.getConversation(data.conversationId, userId);
      const participantIds = conversation.participants.map(p => p.userId);

      // Broadcast to conversation room (except sender)
      client.to(`conversation:${data.conversationId}`).emit('userTyping', {
        conversationId: data.conversationId,
        userId,
        isTyping: data.isTyping,
        timestamp: new Date(),
        userInfo: {
          firstName: conversation.participants.find(p => p.userId === userId)?.user?.firstName,
          lastName: conversation.participants.find(p => p.userId === userId)?.user?.lastName,
        },
      });

      // If user stopped typing, clean up after a delay
      if (!data.isTyping) {
        setTimeout(() => {
          this.cleanupTypingIndicator(data.conversationId, userId);
        }, 2000); // 2 second delay before cleanup
      }

      return { success: true };
    } catch (error) {
      this.logger.error('Typing indicator error:', error);
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('getTypingUsers')
  async handleGetTypingUsers(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const userId = this.socketUsers.get(client.id);
    
    if (!userId) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      const typingUsers = await this.getActiveTypingUsers(data.conversationId);
      
      return { 
        success: true, 
        typingUsers: typingUsers.filter(u => u.userId !== userId) // Exclude current user
      };
    } catch (error) {
      this.logger.error('Get typing users error:', error);
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; messageId?: string },
  ) {
    const userId = this.socketUsers.get(client.id);
    
    if (!userId) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      await this.messagingService.markAsRead(data.conversationId, userId, data.messageId);

      // Get conversation participants for targeted broadcasting
      const conversation = await this.messagingService.getConversation(data.conversationId, userId);
      const participantIds = conversation.participants.map(p => p.userId);

      // Emit read receipt to conversation
      this.server
        .to(`conversation:${data.conversationId}`)
        .emit('messageRead', {
          conversationId: data.conversationId,
          userId,
          messageId: data.messageId,
          timestamp: new Date(),
          userInfo: {
            firstName: conversation.participants.find(p => p.userId === userId)?.user?.firstName,
            lastName: conversation.participants.find(p => p.userId === userId)?.user?.lastName,
          },
        });

      // Update unread counts for all participants
      const unreadCounts = await this.getUnreadCounts(data.conversationId, participantIds);
      this.server
        .to(`conversation:${data.conversationId}`)
        .emit('unreadCountsUpdated', {
          conversationId: data.conversationId,
          unreadCounts,
          timestamp: new Date(),
        });

      // Broadcast to user's other devices
      this.broadcastToUserDevices(userId, 'messagesRead', {
        conversationId: data.conversationId,
        messageId: data.messageId,
        timestamp: new Date(),
      });

      return { success: true };
    } catch (error) {
      this.logger.error('Mark as read error:', error);
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('getReadReceipts')
  async handleGetReadReceipts(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string },
  ) {
    const userId = this.socketUsers.get(client.id);
    
    if (!userId) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      const receipts = await this.getMessageReceipts(data.messageId);
      
      return { 
        success: true, 
        receipts: receipts.map(receipt => ({
          userId: receipt.userId,
          status: receipt.status,
          timestamp: receipt.timestamp,
          userInfo: receipt.user ? {
            firstName: receipt.user.firstName,
            lastName: receipt.user.lastName,
          } : null,
        }))
      };
    } catch (error) {
      this.logger.error('Get read receipts error:', error);
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('markMessageAsDelivered')
  async handleMarkMessageAsDelivered(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string },
  ) {
    const userId = this.socketUsers.get(client.id);
    
    if (!userId) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      // Update message receipt status to delivered
      await this.messagingService['receiptRepository'].update(
        { messageId: data.messageId, userId },
        { status: 'delivered' as any }
      );

      // Get message details for broadcasting
      const message = await this.messagingService['messageRepository'].findOne({
        where: { id: data.messageId },
        relations: ['conversation'],
      });

      if (message) {
        // Broadcast delivery receipt to conversation
        this.server
          .to(`conversation:${message.conversationId}`)
          .emit('messageDelivered', {
            messageId: data.messageId,
            conversationId: message.conversationId,
            userId,
            timestamp: new Date(),
          });
      }

      return { success: true };
    } catch (error) {
      this.logger.error('Mark message as delivered error:', error);
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('joinConversation')
  async handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const userId = this.socketUsers.get(client.id);
    
    if (!userId) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      // Verify user is a participant
      const conversation = await this.messagingService.getConversation(data.conversationId, userId);
      
      client.join(`conversation:${data.conversationId}`);
      
      this.logger.log(`User ${userId} joined conversation ${data.conversationId}`);
      return { success: true };
    } catch (error) {
      this.logger.error('Join conversation error:', error);
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('leaveConversation')
  async handleLeaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    client.leave(`conversation:${data.conversationId}`);
    
    const userId = this.socketUsers.get(client.id);
    if (userId) {
      this.logger.log(`User ${userId} left conversation ${data.conversationId}`);
    }
    
    return { success: true };
  }

  @SubscribeMessage('editMessage')
  async handleEditMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string; content: string },
  ) {
    const userId = this.socketUsers.get(client.id);
    
    if (!userId) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      const message = await this.messagingService.editMessage(data.messageId, userId, data.content);

      // Emit to conversation room
      this.server
        .to(`conversation:${message.conversationId}`)
        .emit('messageUpdated', message);

      return { success: true, message };
    } catch (error) {
      this.logger.error('Edit message error:', error);
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('deleteMessage')
  async handleDeleteMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string },
  ) {
    const userId = this.socketUsers.get(client.id);
    
    if (!userId) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      const result = await this.messagingService.deleteMessage(data.messageId, userId);

      if (result.success) {
        // Emit to conversation room
        this.server.emit('messageDeleted', {
          messageId: data.messageId,
          deletedBy: userId,
          timestamp: new Date(),
        });
      }

      return result;
    } catch (error) {
      this.logger.error('Delete message error:', error);
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('getOnlineUsers')
  async handleGetOnlineUsers(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const userId = this.socketUsers.get(client.id);
    
    if (!userId) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      // Get conversation participants
      const conversation = await this.messagingService.getConversation(data.conversationId, userId);
      const participantIds = conversation.participants.map(p => p.userId);
      
      // Find online participants
      const onlineUsers = participantIds.filter(participantId => 
        this.userSockets.has(participantId)
      );

      return { success: true, onlineUsers };
    } catch (error) {
      this.logger.error('Get online users error:', error);
      return { success: false, error: error.message };
    }
  }

  // ========== UTILITY METHODS ==========

  private extractUserIdFromSocket(client: Socket): string | null {
    // TODO: Implement proper JWT token validation
    // For now, extract from auth token or headers
    const token = client.handshake.auth?.token || 
                  client.handshake.headers?.authorization?.split(' ')[1];
    
    if (!token) {
      return null;
    }

    // Mock user ID extraction - replace with actual JWT validation
    // In production, decode and validate the JWT token here
    return 'mock-user-id';
  }

  private async getUnreadCounts(conversationId: string, participantIds: string[]): Promise<Record<string, number>> {
    try {
      const unreadCounts: Record<string, number> = {};
      
      for (const participantId of participantIds) {
        const participant = await this.messagingService['participantRepository'].findOne({
          where: { conversationId, userId: participantId },
          select: ['unreadCount'],
        });
        
        unreadCounts[participantId] = participant?.unreadCount || 0;
      }
      
      return unreadCounts;
    } catch (error) {
      this.logger.error('Error getting unread counts:', error);
      return {};
    }
  }

  private async sendPushNotifications(userIds: string[], notification: any): Promise<void> {
    try {
      // TODO: Implement actual push notification service
      // This would integrate with Firebase Cloud Messaging or similar
      this.logger.log(`Sending push notifications to users: ${userIds.join(', ')}`);
      
      // Mock implementation - replace with actual push service
      for (const userId of userIds) {
        if (!this.isUserOnline(userId)) {
          // User is offline, send push notification
          this.logger.log(`Sending push notification to offline user: ${userId}`);
        }
      }
    } catch (error) {
      this.logger.error('Error sending push notifications:', error);
    }
  }

  private broadcastToUserDevices(userId: string, event: string, data: any): void {
    const userSockets = this.userSockets.get(userId);
    if (userSockets) {
      userSockets.forEach(socketId => {
        this.server.to(socketId).emit(event, data);
      });
    }
  }

  private async getMessageReceipts(messageId: string): Promise<any[]> {
    try {
      const receipts = await this.messagingService['receiptRepository'].find({
        where: { messageId },
        relations: ['user'],
        order: { timestamp: 'ASC' },
      });

      return receipts.map(receipt => ({
        userId: receipt.userId,
        status: receipt.status,
        timestamp: receipt.timestamp,
        user: receipt.user ? {
          id: receipt.user.id,
          firstName: receipt.user.firstName,
          lastName: receipt.user.lastName,
          profilePictureUrl: receipt.user.profilePictureUrl,
        } : null,
      }));
    } catch (error) {
      this.logger.error('Error getting message receipts:', error);
      return [];
    }
  }

  private async joinUserConversations(client: Socket, userId: string): Promise<void> {
    try {
      // Get user's conversations and join their rooms
      const conversations = await this.messagingService.getUserConversations(userId, {
        page: 1,
        limit: 100, // Get all conversations for room joining
      });

      conversations.data.forEach(conversation => {
        client.join(`conversation:${conversation.id}`);
      });
    } catch (error) {
      this.logger.error('Error joining user conversations:', error);
    }
  }

  private broadcastUserStatus(userId: string, isOnline: boolean): void {
    this.server.emit('userStatusChanged', {
      userId,
      isOnline,
      timestamp: new Date(),
    });
  }


  private async cleanupExpiredTypingIndicators(): Promise<void> {
    try {
      // TODO: Implement cleanup of expired typing indicators
      // This would query the database for expired indicators and clean them up
      const expiredIndicators = await this.messagingService['typingRepository'].find({
        where: {
          expiresAt: new Date() as any, // This will be handled by query builder
        },
      });

      for (const indicator of expiredIndicators) {
        // Broadcast that user stopped typing
        this.server
          .to(`conversation:${indicator.conversationId}`)
          .emit('userTyping', {
            conversationId: indicator.conversationId,
            userId: indicator.userId,
            isTyping: false,
            timestamp: new Date(),
          });

        // Remove expired indicator
        await this.messagingService['typingRepository'].remove(indicator);
      }
    } catch (error) {
      this.logger.error('Error cleaning up typing indicators:', error);
    }
  }

  private async getActiveTypingUsers(conversationId: string): Promise<any[]> {
    try {
      const typingIndicators = await this.messagingService['typingRepository'].find({
        where: { 
          conversationId,
          isTyping: true,
          expiresAt: new Date() as any, // Active indicators
        },
        relations: ['user'],
      });

      return typingIndicators.map(indicator => ({
        userId: indicator.userId,
        isTyping: indicator.isTyping,
        timestamp: indicator.updatedAt,
        userInfo: indicator.user ? {
          firstName: indicator.user.firstName,
          lastName: indicator.user.lastName,
        } : null,
      }));
    } catch (error) {
      this.logger.error('Error getting active typing users:', error);
      return [];
    }
  }

  private async cleanupTypingIndicator(conversationId: string, userId: string): Promise<void> {
    try {
      const indicator = await this.messagingService['typingRepository'].findOne({
        where: { conversationId, userId },
      });

      if (indicator && indicator.isTyping) {
        indicator.stopTyping();
        await this.messagingService['typingRepository'].save(indicator);
      }
    } catch (error) {
      this.logger.error('Error cleaning up typing indicator:', error);
    }
  }

  // ========== PUBLIC METHODS FOR EXTERNAL USE ==========

  async notifyNewMessage(conversationId: string, message: any): Promise<void> {
    this.server
      .to(`conversation:${conversationId}`)
      .emit('newMessage', message);
  }

  async notifyMessageUpdated(conversationId: string, message: any): Promise<void> {
    this.server
      .to(`conversation:${conversationId}`)
      .emit('messageUpdated', message);
  }

  async notifyMessageDeleted(conversationId: string, messageId: string): Promise<void> {
    this.server
      .to(`conversation:${conversationId}`)
      .emit('messageDeleted', { messageId, conversationId });
  }

  async notifyConversationUpdated(conversationId: string, data: any): Promise<void> {
    this.server
      .to(`conversation:${conversationId}`)
      .emit('conversationUpdated', data);
  }

  async notifyUserTyping(conversationId: string, userId: string, isTyping: boolean): Promise<void> {
    this.server
      .to(`conversation:${conversationId}`)
      .emit('userTyping', {
        conversationId,
        userId,
        isTyping,
        timestamp: new Date(),
      });
  }

  async notifyMessageRead(conversationId: string, userId: string, messageId?: string): Promise<void> {
    this.server
      .to(`conversation:${conversationId}`)
      .emit('messageRead', {
        conversationId,
        userId,
        messageId,
        timestamp: new Date(),
      });
  }

  // Get online users count
  getOnlineUsersCount(): number {
    return this.userSockets.size;
  }

  // Get user's socket count
  getUserSocketCount(userId: string): number {
    return this.userSockets.get(userId)?.size || 0;
  }

  // Check if user is online
  isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId) && this.userSockets.get(userId)!.size > 0;
  }
}
