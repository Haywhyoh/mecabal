// Simple event emitter for React Native compatibility
class SimpleEventEmitter {
  private listeners: Map<string, Set<Function>> = new Map();

  emit(event: string, ...args: any[]): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(listener => {
        try {
          listener(...args);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  on(event: string, listener: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
  }

  off(event: string, listener: Function): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(listener);
      if (eventListeners.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  removeAllListeners(event?: string): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'image' | 'location' | 'audio' | 'system';
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  replyTo?: string; // Message ID this is replying to
  edited?: boolean;
  editedAt?: Date;
  metadata?: {
    imageUrl?: string;
    imageWidth?: number;
    imageHeight?: number;
    audioUrl?: string;
    audioDuration?: number;
    location?: {
      latitude: number;
      longitude: number;
      address?: string;
    };
  };
}

export interface Conversation {
  id: string;
  type: 'direct' | 'group' | 'community';
  title?: string;
  participants: Participant[];
  lastMessage?: Message;
  unreadCount: number;
  isArchived: boolean;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
  metadata?: {
    description?: string;
    avatar?: string;
    communityId?: string;
    eventId?: string;
    groupAdmin?: string[];
  };
}

export interface Participant {
  id: string;
  name: string;
  avatar?: string;
  role?: 'admin' | 'member';
  isOnline: boolean;
  lastSeen?: Date;
  joinedAt: Date;
  isVerified?: boolean;
  location?: string;
}

export interface TypingStatus {
  conversationId: string;
  userId: string;
  userName: string;
  isTyping: boolean;
  timestamp: Date;
}

export interface MessageDeliveryStatus {
  messageId: string;
  userId: string;
  status: 'delivered' | 'read';
  timestamp: Date;
}

export class MessagingService extends SimpleEventEmitter {
  private static instance: MessagingService;
  private conversations: Map<string, Conversation> = new Map();
  private messages: Map<string, Message[]> = new Map();
  private typingStatus: Map<string, TypingStatus[]> = new Map();
  private currentUserId: string = 'current_user'; // This would come from auth service
  private isConnected: boolean = false;

  private constructor() {
    super();
    this.initializeService();
    this.loadDemoData();
  }

  public static getInstance(): MessagingService {
    if (!MessagingService.instance) {
      MessagingService.instance = new MessagingService();
    }
    return MessagingService.instance;
  }

  private initializeService() {
    // In a real app, this would establish WebSocket connection
    console.log('Initializing messaging service...');
    
    // Simulate connection
    setTimeout(() => {
      this.isConnected = true;
      this.emit('connected');
    }, 1000);

    // Simulate periodic connection status changes
    setInterval(() => {
      const shouldDisconnect = Math.random() < 0.05; // 5% chance
      if (shouldDisconnect && this.isConnected) {
        this.isConnected = false;
        this.emit('disconnected');
        
        // Reconnect after 2-5 seconds
        setTimeout(() => {
          this.isConnected = true;
          this.emit('connected');
        }, 2000 + Math.random() * 3000);
      }
    }, 30000); // Check every 30 seconds
  }

  public getConversations(): Conversation[] {
    return Array.from(this.conversations.values())
      .sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  }

  public getConversation(conversationId: string): Conversation | undefined {
    return this.conversations.get(conversationId);
  }

  public getMessages(conversationId: string): Message[] {
    return this.messages.get(conversationId) || [];
  }

  public async sendMessage(
    conversationId: string,
    content: string,
    type: 'text' | 'image' | 'location' | 'audio' = 'text',
    metadata?: Message['metadata']
  ): Promise<Message> {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    const message: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      conversationId,
      senderId: this.currentUserId,
      senderName: 'You',
      content,
      timestamp: new Date(),
      type,
      status: 'sending',
      metadata,
    };

    // Add message to conversation
    const conversationMessages = this.messages.get(conversationId) || [];
    conversationMessages.push(message);
    this.messages.set(conversationId, conversationMessages);

    // Update conversation
    conversation.lastMessage = message;
    conversation.updatedAt = new Date();

    this.emit('messageAdded', message);

    // Simulate sending delay
    setTimeout(() => {
      message.status = 'sent';
      this.emit('messageStatusChanged', message);

      // Simulate delivery after another delay
      setTimeout(() => {
        message.status = 'delivered';
        this.emit('messageStatusChanged', message);
      }, 1000 + Math.random() * 2000);
    }, 500 + Math.random() * 1500);

    return message;
  }

  public async editMessage(messageId: string, newContent: string): Promise<void> {
    for (const [conversationId, messages] of this.messages) {
      const message = messages.find(m => m.id === messageId);
      if (message && message.senderId === this.currentUserId) {
        message.content = newContent;
        message.edited = true;
        message.editedAt = new Date();
        this.emit('messageEdited', message);
        break;
      }
    }
  }

  public async deleteMessage(messageId: string): Promise<void> {
    for (const [conversationId, messages] of this.messages) {
      const messageIndex = messages.findIndex(m => m.id === messageId);
      if (messageIndex !== -1 && messages[messageIndex].senderId === this.currentUserId) {
        messages.splice(messageIndex, 1);
        this.emit('messageDeleted', messageId, conversationId);
        break;
      }
    }
  }

  public async markAsRead(conversationId: string): Promise<void> {
    const conversation = this.conversations.get(conversationId);
    if (conversation) {
      conversation.unreadCount = 0;
      this.emit('conversationUpdated', conversation);

      // Mark messages as read
      const messages = this.messages.get(conversationId) || [];
      messages
        .filter(m => m.senderId !== this.currentUserId && m.status !== 'read')
        .forEach(m => {
          m.status = 'read';
          this.emit('messageStatusChanged', m);
        });
    }
  }

  public async createDirectConversation(participantId: string, participantName: string): Promise<Conversation> {
    const conversationId = `direct_${this.currentUserId}_${participantId}`;
    
    const conversation: Conversation = {
      id: conversationId,
      type: 'direct',
      participants: [
        {
          id: this.currentUserId,
          name: 'You',
          isOnline: true,
          joinedAt: new Date(),
          isVerified: true,
        },
        {
          id: participantId,
          name: participantName,
          isOnline: Math.random() > 0.3, // 70% chance of being online
          joinedAt: new Date(),
          isVerified: Math.random() > 0.2, // 80% chance of being verified
          location: 'Ikeja, Lagos', // Demo location
        },
      ],
      unreadCount: 0,
      isArchived: false,
      isPinned: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.conversations.set(conversationId, conversation);
    this.messages.set(conversationId, []);
    
    this.emit('conversationCreated', conversation);
    return conversation;
  }

  public async createGroupConversation(
    title: string,
    participantIds: string[],
    description?: string
  ): Promise<Conversation> {
    const conversationId = `group_${Date.now()}`;

    const conversation: Conversation = {
      id: conversationId,
      type: 'group',
      title,
      participants: [
        {
          id: this.currentUserId,
          name: 'You',
          role: 'admin',
          isOnline: true,
          joinedAt: new Date(),
          isVerified: true,
        },
        ...participantIds.map(id => ({
          id,
          name: `User ${id.slice(-3)}`, // Demo names
          role: 'member' as const,
          isOnline: Math.random() > 0.3,
          joinedAt: new Date(),
          isVerified: Math.random() > 0.2,
          location: Math.random() > 0.5 ? 'Ikeja, Lagos' : 'Victoria Island, Lagos',
        })),
      ],
      unreadCount: 0,
      isArchived: false,
      isPinned: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {
        description,
        groupAdmin: [this.currentUserId],
      },
    };

    this.conversations.set(conversationId, conversation);
    this.messages.set(conversationId, []);

    // Add system message
    const systemMessage: Message = {
      id: `sys_${Date.now()}`,
      conversationId,
      senderId: 'system',
      senderName: 'System',
      content: `Group "${title}" created`,
      timestamp: new Date(),
      type: 'system',
      status: 'delivered',
    };

    this.messages.get(conversationId)?.push(systemMessage);
    
    this.emit('conversationCreated', conversation);
    return conversation;
  }

  public async startTyping(conversationId: string): Promise<void> {
    const typingUsers = this.typingStatus.get(conversationId) || [];
    const existingIndex = typingUsers.findIndex(t => t.userId === this.currentUserId);
    
    const typingStatus: TypingStatus = {
      conversationId,
      userId: this.currentUserId,
      userName: 'You',
      isTyping: true,
      timestamp: new Date(),
    };

    if (existingIndex >= 0) {
      typingUsers[existingIndex] = typingStatus;
    } else {
      typingUsers.push(typingStatus);
    }

    this.typingStatus.set(conversationId, typingUsers);
    this.emit('typingStatusChanged', conversationId, typingUsers);
  }

  public async stopTyping(conversationId: string): Promise<void> {
    const typingUsers = this.typingStatus.get(conversationId) || [];
    const filteredUsers = typingUsers.filter(t => t.userId !== this.currentUserId);
    
    this.typingStatus.set(conversationId, filteredUsers);
    this.emit('typingStatusChanged', conversationId, filteredUsers);
  }

  public getTypingUsers(conversationId: string): TypingStatus[] {
    return this.typingStatus.get(conversationId) || [];
  }

  public async archiveConversation(conversationId: string): Promise<void> {
    const conversation = this.conversations.get(conversationId);
    if (conversation) {
      conversation.isArchived = true;
      this.emit('conversationUpdated', conversation);
    }
  }

  public async pinConversation(conversationId: string): Promise<void> {
    const conversation = this.conversations.get(conversationId);
    if (conversation) {
      conversation.isPinned = !conversation.isPinned;
      this.emit('conversationUpdated', conversation);
    }
  }

  public async searchMessages(query: string): Promise<Message[]> {
    const results: Message[] = [];
    const lowercaseQuery = query.toLowerCase();

    for (const messages of this.messages.values()) {
      for (const message of messages) {
        if (
          message.content.toLowerCase().includes(lowercaseQuery) ||
          message.senderName.toLowerCase().includes(lowercaseQuery)
        ) {
          results.push(message);
        }
      }
    }

    return results.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  public getConnectionStatus(): boolean {
    return this.isConnected;
  }

  public async reconnect(): Promise<void> {
    // Simulate reconnection
    this.isConnected = false;
    this.emit('disconnected');
    
    setTimeout(() => {
      this.isConnected = true;
      this.emit('connected');
    }, 2000);
  }

  // Demo data
  private loadDemoData() {
    // Create demo conversations
    const conversations: Conversation[] = [
      {
        id: 'conv_kemi',
        type: 'direct',
        participants: [
          {
            id: this.currentUserId,
            name: 'You',
            isOnline: true,
            joinedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            isVerified: true,
          },
          {
            id: 'user_kemi',
            name: 'Kemi Adebayo',
            avatar: 'https://randomuser.me/api/portraits/women/1.jpg',
            isOnline: true,
            lastSeen: new Date(Date.now() - 5 * 60 * 1000),
            joinedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            isVerified: true,
            location: 'Ikeja GRA, Lagos',
          },
        ],
        unreadCount: 2,
        isArchived: false,
        isPinned: true,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 5 * 60 * 1000),
      },
      {
        id: 'conv_estate_security',
        type: 'group',
        title: 'Estate Security Group',
        participants: [
          {
            id: this.currentUserId,
            name: 'You',
            role: 'member',
            isOnline: true,
            joinedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
            isVerified: true,
          },
          {
            id: 'user_security_chief',
            name: 'Musa Ibrahim (Security)',
            role: 'admin',
            isOnline: true,
            joinedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
            isVerified: true,
            location: 'Estate Security Office',
          },
          {
            id: 'user_ahmed',
            name: 'Ahmed Yusuf',
            role: 'member',
            isOnline: false,
            lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000),
            joinedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
            isVerified: true,
            location: 'Block C, Ikeja GRA',
          },
        ],
        unreadCount: 1,
        isArchived: false,
        isPinned: false,
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 30 * 60 * 1000),
        metadata: {
          description: 'For estate security matters and updates',
          groupAdmin: ['user_security_chief'],
        },
      },
      {
        id: 'conv_community',
        type: 'community',
        title: 'Ikeja GRA Community',
        participants: [
          {
            id: this.currentUserId,
            name: 'You',
            role: 'member',
            isOnline: true,
            joinedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
            isVerified: true,
          },
          {
            id: 'user_folake',
            name: 'Folake Ogundimu',
            role: 'admin',
            isOnline: false,
            lastSeen: new Date(Date.now() - 4 * 60 * 60 * 1000),
            joinedAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
            isVerified: true,
            location: 'Community President',
          },
        ],
        unreadCount: 0,
        isArchived: false,
        isPinned: false,
        createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        metadata: {
          description: 'Official Ikeja GRA community discussions',
          communityId: 'community_ikeja_gra',
          groupAdmin: ['user_folake'],
        },
      },
    ];

    conversations.forEach(conv => this.conversations.set(conv.id, conv));

    // Create demo messages
    const demoMessages: { [conversationId: string]: Message[] } = {
      conv_kemi: [
        {
          id: 'msg_1',
          conversationId: 'conv_kemi',
          senderId: 'user_kemi',
          senderName: 'Kemi Adebayo',
          senderAvatar: 'https://randomuser.me/api/portraits/women/1.jpg',
          content: 'Good morning! How are you doing today?',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          type: 'text',
          status: 'read',
        },
        {
          id: 'msg_2',
          conversationId: 'conv_kemi',
          senderId: this.currentUserId,
          senderName: 'You',
          content: 'Morning Kemi! I\'m doing well, thanks. How about you?',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000 + 5 * 60 * 1000),
          type: 'text',
          status: 'read',
        },
        {
          id: 'msg_3',
          conversationId: 'conv_kemi',
          senderId: 'user_kemi',
          senderName: 'Kemi Adebayo',
          senderAvatar: 'https://randomuser.me/api/portraits/women/1.jpg',
          content: 'I wanted to thank you again for helping with the community garden project yesterday! 🌱',
          timestamp: new Date(Date.now() - 10 * 60 * 1000),
          type: 'text',
          status: 'delivered',
        },
        {
          id: 'msg_4',
          conversationId: 'conv_kemi',
          senderId: 'user_kemi',
          senderName: 'Kemi Adebayo',
          senderAvatar: 'https://randomuser.me/api/portraits/women/1.jpg',
          content: 'The plants look amazing! Are you free this weekend to help with the watering system?',
          timestamp: new Date(Date.now() - 5 * 60 * 1000),
          type: 'text',
          status: 'delivered',
        },
      ],
      conv_estate_security: [
        {
          id: 'msg_sec_1',
          conversationId: 'conv_estate_security',
          senderId: 'user_security_chief',
          senderName: 'Musa Ibrahim (Security)',
          content: 'Good evening everyone. Just to inform you that we will be conducting security patrols tonight from 10 PM to 6 AM.',
          timestamp: new Date(Date.now() - 45 * 60 * 1000),
          type: 'text',
          status: 'read',
        },
        {
          id: 'msg_sec_2',
          conversationId: 'conv_estate_security',
          senderId: 'user_ahmed',
          senderName: 'Ahmed Yusuf',
          content: 'Thank you for the update. Any specific areas you\'ll be focusing on?',
          timestamp: new Date(Date.now() - 40 * 60 * 1000),
          type: 'text',
          status: 'read',
        },
        {
          id: 'msg_sec_3',
          conversationId: 'conv_estate_security',
          senderId: 'user_security_chief',
          senderName: 'Musa Ibrahim (Security)',
          content: 'We\'ll be focusing on the back gate area and the playground. There have been reports of unusual activities.',
          timestamp: new Date(Date.now() - 30 * 60 * 1000),
          type: 'text',
          status: 'delivered',
        },
      ],
      conv_community: [
        {
          id: 'msg_comm_1',
          conversationId: 'conv_community',
          senderId: 'user_folake',
          senderName: 'Folake Ogundimu',
          content: 'Reminder: Community meeting tomorrow at 4 PM in the community center. We\'ll be discussing the new waste management system.',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
          type: 'text',
          status: 'read',
        },
        {
          id: 'msg_comm_2',
          conversationId: 'conv_community',
          senderId: 'system',
          senderName: 'System',
          content: '15 people have confirmed attendance for tomorrow\'s meeting.',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          type: 'system',
          status: 'delivered',
        },
      ],
    };

    Object.entries(demoMessages).forEach(([conversationId, messages]) => {
      this.messages.set(conversationId, messages);
      
      // Set last message for conversation
      const conversation = this.conversations.get(conversationId);
      if (conversation && messages.length > 0) {
        conversation.lastMessage = messages[messages.length - 1];
      }
    });
  }
}

export default MessagingService;