import { ENV } from '../config/environment';
import AsyncStorage from '@react-native-async-storage/async-storage';

// WebSocket event types
export interface WebSocketEvents {
  // Connection events
  connect: () => void;
  disconnect: (reason: string) => void;
  reconnect: (attemptNumber: number) => void;
  reconnect_error: (error: Error) => void;
  reconnect_failed: () => void;

  // Message events
  newMessage: (message: any) => void;
  messageUpdated: (message: any) => void;
  messageDeleted: (data: { messageId: string; conversationId: string }) => void;
  messageRead: (data: { conversationId: string; userId: string; messageId?: string; timestamp: Date }) => void;
  messageDelivered: (data: { messageId: string; conversationId: string; userId: string; timestamp: Date }) => void;

  // Conversation events
  conversationUpdated: (conversation: any) => void;
  unreadCountsUpdated: (data: { conversationId: string; unreadCounts: Record<string, number> }) => void;

  // Typing events
  userTyping: (data: { conversationId: string; userId: string; isTyping: boolean; timestamp: Date; userInfo?: any }) => void;

  // Status events
  userStatusChanged: (data: { userId: string; isOnline: boolean; timestamp: Date }) => void;

  // Receipt events
  messageReceipts: (data: { messageId: string; conversationId: string; receipts: any[]; timestamp: Date }) => void;

  // User events
  messageSent: (data: { messageId: string; conversationId: string; status: string }) => void;
  messagesRead: (data: { conversationId: string; messageId?: string; timestamp: Date }) => void;
}

// WebSocket message types
export interface SendMessageData {
  conversationId: string;
  content: string;
  type?: 'text' | 'image' | 'video' | 'audio' | 'location' | 'file' | 'system';
  replyToMessageId?: string;
  metadata?: Record<string, any>;
}

export interface TypingData {
  conversationId: string;
  isTyping: boolean;
}

export interface MarkAsReadData {
  conversationId: string;
  messageId?: string;
}

export interface JoinConversationData {
  conversationId: string;
}

export interface EditMessageData {
  messageId: string;
  content: string;
}

export interface DeleteMessageData {
  messageId: string;
}

export interface GetOnlineUsersData {
  conversationId: string;
}

export interface GetTypingUsersData {
  conversationId: string;
}

export interface GetReadReceiptsData {
  messageId: string;
}

export interface MarkMessageAsDeliveredData {
  messageId: string;
}

/**
 * WebSocket Service for real-time messaging
 * Handles native WebSocket connection and event management
 */
export class WebSocketService {
  private static instance: WebSocketService;
  private socket: any | null = null;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;
  private eventListeners: Map<string, Set<Function>> = new Map();
  private authToken: string | null = null;
  private messageQueue: Array<{ event: string; data: any; resolve: Function; reject: Function }> = [];
  private requestId: number = 0;

  private constructor() {
    this.initializeService();
  }

  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  private async initializeService(): Promise<void> {
    // Load auth token from storage
    this.authToken = await AsyncStorage.getItem('auth_token');
    
    // Set up token refresh listener
    this.setupTokenRefreshListener();
  }

  private setupTokenRefreshListener(): void {
    // Listen for token updates from other parts of the app
    // This would typically be done through an event emitter or context
    // For now, we'll check for token changes periodically
    setInterval(async () => {
      const newToken = await AsyncStorage.getItem('auth_token');
      if (newToken !== this.authToken) {
        this.authToken = newToken;
        if (this.isConnected) {
          // Reconnect with new token
          this.disconnect();
          setTimeout(() => this.connect(), 1000);
        }
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Connect to WebSocket server
   */
  public async connect(): Promise<void> {
    if (this.isConnected || this.socket) {
      return;
    }

    try {
      // Get fresh auth token
      this.authToken = await AsyncStorage.getItem('auth_token');
      
      if (!this.authToken) {
        throw new Error('No authentication token available');
      }

      // Create WebSocket connection using Socket.IO
      const io = require('socket.io-client').io;
      // Use messaging service port (3004) instead of main API port (3000)
      const messagingUrl = ENV.API.BASE_URL.replace(':3000', ':3004');
      this.socket = io(`${messagingUrl}/messaging`, {
        auth: {
          token: this.authToken,
        },
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true,
      });

      this.setupEventListeners();
      
      console.log('🔌 Connecting to messaging WebSocket...');
    } catch (error) {
      console.error('❌ Failed to connect to WebSocket:', error);
      throw error;
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  public disconnect(): void {
    if (this.socket) {
      console.log('🔌 Disconnecting from WebSocket...');
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
    this.reconnectAttempts = 0;
  }

  /**
   * Set up WebSocket event listeners
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit('connect');
      
      // Process any queued messages
      this.processMessageQueue();
    });

    this.socket.on('disconnect', (reason: any) => {
      console.log('❌ WebSocket disconnected:', reason);
      this.isConnected = false;
      this.emit('disconnect', reason);
      
      // Attempt to reconnect if not manually disconnected
      if (reason !== 'io client disconnect') {
        this.attemptReconnect();
      }
    });

    this.socket.on('connect_error', (error: any) => {
      console.error('❌ WebSocket connection error:', error);
      this.emit('reconnect_error', error);
    });

    // Message events
    this.socket.on('newMessage', (message: any) => {
      console.log('📨 New message received:', message.id);
      this.emit('newMessage', message);
    });

    this.socket.on('messageUpdated', (message: any) => {
      console.log('✏️ Message updated:', message.id);
      this.emit('messageUpdated', message);
    });

    this.socket.on('messageDeleted', (data: any) => {
      console.log('🗑️ Message deleted:', data.messageId);
      this.emit('messageDeleted', data);
    });

    this.socket.on('messageRead', (data: any) => {
      console.log('👁️ Message read:', data.messageId);
      this.emit('messageRead', data);
    });

    this.socket.on('messageDelivered', (data: any) => {
      console.log('📬 Message delivered:', data.messageId);
      this.emit('messageDelivered', data);
    });

    // Conversation events
    this.socket.on('conversationUpdated', (conversation: any) => {
      console.log('💬 Conversation updated:', conversation.id);
      this.emit('conversationUpdated', conversation);
    });

    this.socket.on('unreadCountsUpdated', (data: any) => {
      console.log('🔢 Unread counts updated:', data.conversationId);
      this.emit('unreadCountsUpdated', data);
    });

    // Typing events
    this.socket.on('userTyping', (data: any) => {
      this.emit('userTyping', data);
    });

    // Status events
    this.socket.on('userStatusChanged', (data: any) => {
      this.emit('userStatusChanged', data);
    });

    // Receipt events
    this.socket.on('messageReceipts', (data: any) => {
      this.emit('messageReceipts', data);
    });

    // User events
    this.socket.on('messageSent', (data: any) => {
      this.emit('messageSent', data);
    });

    this.socket.on('messagesRead', (data: any) => {
      this.emit('messagesRead', data);
    });
  }


  /**
   * Attempt to reconnect to WebSocket
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached');
      this.emit('reconnect_failed');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`);
    
    setTimeout(() => {
      this.emit('reconnect', this.reconnectAttempts);
      this.connect().catch((error) => {
        console.error('❌ Reconnection failed:', error);
      });
    }, delay);
  }

  // ========== MESSAGE METHODS ==========

  /**
   * Send message
   */
  public sendMessage(data: SendMessageData): Promise<any> {
    return this.emitWithResponse('sendMessage', data);
  }

  /**
   * Edit message
   */
  public editMessage(data: EditMessageData): Promise<any> {
    return this.emitWithResponse('editMessage', data);
  }

  /**
   * Delete message
   */
  public deleteMessage(data: DeleteMessageData): Promise<any> {
    return this.emitWithResponse('deleteMessage', data);
  }

  // ========== TYPING METHODS ==========

  /**
   * Start typing
   */
  public startTyping(conversationId: string): Promise<any> {
    return this.emitWithResponse('typing', { conversationId, isTyping: true });
  }

  /**
   * Stop typing
   */
  public stopTyping(conversationId: string): Promise<any> {
    return this.emitWithResponse('typing', { conversationId, isTyping: false });
  }

  /**
   * Get typing users
   */
  public getTypingUsers(conversationId: string): Promise<any> {
    return this.emitWithResponse('getTypingUsers', { conversationId });
  }

  // ========== READ RECEIPT METHODS ==========

  /**
   * Mark as read
   */
  public markAsRead(data: MarkAsReadData): Promise<any> {
    return this.emitWithResponse('markAsRead', data);
  }

  /**
   * Mark message as delivered
   */
  public markMessageAsDelivered(messageId: string): Promise<any> {
    return this.emitWithResponse('markMessageAsDelivered', { messageId });
  }

  /**
   * Get read receipts
   */
  public getReadReceipts(messageId: string): Promise<any> {
    return this.emitWithResponse('getReadReceipts', { messageId });
  }

  // ========== CONVERSATION METHODS ==========

  /**
   * Join conversation room
   */
  public joinConversation(conversationId: string): Promise<any> {
    return this.emitWithResponse('joinConversation', { conversationId });
  }

  /**
   * Leave conversation room
   */
  public leaveConversation(conversationId: string): Promise<any> {
    return this.emitWithResponse('leaveConversation', { conversationId });
  }

  /**
   * Get online users
   */
  public getOnlineUsers(conversationId: string): Promise<any> {
    return this.emitWithResponse('getOnlineUsers', { conversationId });
  }

  // ========== EVENT EMITTER METHODS ==========

  /**
   * Add event listener
   */
  public on<K extends keyof WebSocketEvents>(event: K, listener: WebSocketEvents[K]): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(listener);
  }

  /**
   * Remove event listener
   */
  public off<K extends keyof WebSocketEvents>(event: K, listener: WebSocketEvents[K]): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(listener);
      if (listeners.size === 0) {
        this.eventListeners.delete(event);
      }
    }
  }

  /**
   * Emit event to listeners
   */
  private emit<K extends keyof WebSocketEvents>(event: K, ...args: Parameters<WebSocketEvents[K]>): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          (listener as Function)(...args);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Process queued messages when connection is restored
   */
  private processMessageQueue(): void {
    const messages = [...this.messageQueue];
    this.messageQueue = [];
    
    messages.forEach(({ event, data, resolve, reject }) => {
      this.sendWebSocketMessage(event, data)
        .then((value: any) => resolve(value))
        .catch((reason: any) => reject(reason));
    });
  }

  /**
   * Send message through WebSocket
   */
  private sendWebSocketMessage(event: string, data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.socket.connected) {
        // Queue message if not connected
        this.messageQueue.push({ event, data, resolve, reject });
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error('Request timeout'));
      }, 10000); // 10 second timeout

      this.socket.emit(event, data, (response: any) => {
        clearTimeout(timeout);
        if (response.success) {
          resolve(response);
        } else {
          reject(new Error(response.error || 'Request failed'));
        }
      });
    });
  }

  /**
   * Emit event and wait for response
   */
  private emitWithResponse(event: string, data: any): Promise<any> {
    return this.sendWebSocketMessage(event, data);
  }

  // ========== UTILITY METHODS ==========

  /**
   * Check if connected
   */
  public getConnectionStatus(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  /**
   * Get connection info
   */
  public getConnectionInfo(): { connected: boolean; reconnectAttempts: number } {
    return {
      connected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
    };
  }

  /**
   * Force reconnect
   */
  public async forceReconnect(): Promise<void> {
    this.disconnect();
    await new Promise(resolve => setTimeout(resolve, 1000));
    await this.connect();
  }
}

// Export singleton instance
export const webSocketService = WebSocketService.getInstance();

// Export class for testing purposes
export default WebSocketService;
