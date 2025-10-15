import { ENV } from '../config/environment';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Simple WebSocket service that uses native WebSocket
export class SimpleWebSocketService {
  private static instance: SimpleWebSocketService;
  private socket: WebSocket | null = null;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;
  private eventListeners: Map<string, Set<Function>> = new Map();
  private authToken: string | null = null;

  private constructor() {
    this.initializeService();
  }

  public static getInstance(): SimpleWebSocketService {
    if (!SimpleWebSocketService.instance) {
      SimpleWebSocketService.instance = new SimpleWebSocketService();
    }
    return SimpleWebSocketService.instance;
  }

  private async initializeService(): Promise<void> {
    // Load auth token from storage
    this.authToken = await AsyncStorage.getItem('auth_token');
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

      // Create WebSocket connection
              // Use messaging service port (3004) instead of main API port (3000)
              const messagingUrl = ENV.API.BASE_URL.replace(':3000', ':3004');
              const wsUrl = `${messagingUrl.replace('http', 'ws')}/messaging/ws?token=${this.authToken}`;
      this.socket = new WebSocket(wsUrl);

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
      this.socket.close();
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

    this.socket.onopen = () => {
      console.log('✅ WebSocket connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit('connect');
    };

    this.socket.onclose = (event) => {
      console.log('❌ WebSocket disconnected:', event.code, event.reason);
      this.isConnected = false;
      this.emit('disconnect', event.reason || 'Connection closed');
      
      // Attempt to reconnect if not manually disconnected
      if (event.code !== 1000) { // 1000 = normal closure
        this.attemptReconnect();
      }
    };

    this.socket.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
      this.emit('reconnect_error', new Error('WebSocket connection error'));
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
      } catch (error) {
        console.error('❌ Failed to parse WebSocket message:', error);
      }
    };
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(data: any): void {
    const { type, payload } = data;

    // Handle event messages
    switch (type) {
      case 'newMessage':
        console.log('📨 New message received:', payload.id);
        this.emit('newMessage', payload);
        break;
      case 'messageUpdated':
        console.log('✏️ Message updated:', payload.id);
        this.emit('messageUpdated', payload);
        break;
      case 'messageDeleted':
        console.log('🗑️ Message deleted:', payload.messageId);
        this.emit('messageDeleted', payload);
        break;
      case 'messageRead':
        console.log('👁️ Message read:', payload.messageId);
        this.emit('messageRead', payload);
        break;
      case 'messageDelivered':
        console.log('📬 Message delivered:', payload.messageId);
        this.emit('messageDelivered', payload);
        break;
      case 'conversationUpdated':
        console.log('💬 Conversation updated:', payload.id);
        this.emit('conversationUpdated', payload);
        break;
      case 'unreadCountsUpdated':
        console.log('🔢 Unread counts updated:', payload.conversationId);
        this.emit('unreadCountsUpdated', payload);
        break;
      case 'userTyping':
        this.emit('userTyping', payload);
        break;
      case 'userStatusChanged':
        this.emit('userStatusChanged', payload);
        break;
      case 'messageReceipts':
        this.emit('messageReceipts', payload);
        break;
      case 'messageSent':
        this.emit('messageSent', payload);
        break;
      case 'messagesRead':
        this.emit('messagesRead', payload);
        break;
      default:
        console.log('📨 Unknown message type:', type, payload);
    }
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
  public sendMessage(data: any): Promise<any> {
    return this.sendWebSocketMessage('sendMessage', data);
  }

  /**
   * Start typing
   */
  public startTyping(conversationId: string): Promise<any> {
    return this.sendWebSocketMessage('typing', { conversationId, isTyping: true });
  }

  /**
   * Stop typing
   */
  public stopTyping(conversationId: string): Promise<any> {
    return this.sendWebSocketMessage('typing', { conversationId, isTyping: false });
  }

  /**
   * Mark as read
   */
  public markAsRead(data: any): Promise<any> {
    return this.sendWebSocketMessage('markAsRead', data);
  }

  /**
   * Join conversation room
   */
  public joinConversation(conversationId: string): Promise<any> {
    return this.sendWebSocketMessage('joinConversation', { conversationId });
  }

  /**
   * Leave conversation room
   */
  public leaveConversation(conversationId: string): Promise<any> {
    return this.sendWebSocketMessage('leaveConversation', { conversationId });
  }

  /**
   * Send message through WebSocket
   */
  private sendWebSocketMessage(event: string, data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      const message = {
        type: event,
        payload: data,
      };

      try {
        this.socket.send(JSON.stringify(message));
        resolve({ success: true });
      } catch (error) {
        reject(error);
      }
    });
  }

  // ========== EVENT EMITTER METHODS ==========

  /**
   * Add event listener
   */
  public on(event: string, listener: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(listener);
  }

  /**
   * Remove event listener
   */
  public off(event: string, listener: Function): void {
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
  private emit(event: string, ...args: any[]): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(...args);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  // ========== UTILITY METHODS ==========

  /**
   * Check if connected
   */
  public getConnectionStatus(): boolean {
    return this.isConnected && this.socket?.readyState === WebSocket.OPEN;
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
export const simpleWebSocketService = SimpleWebSocketService.getInstance();

// Export class for testing purposes
export default SimpleWebSocketService;
