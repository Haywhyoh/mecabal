import { apiClient } from './apiClient';
import { ENV } from '../../config/environment';

// Messaging API endpoints
const MESSAGING_ENDPOINTS = {
  CONVERSATIONS: '/messaging/conversations',
  MESSAGES: '/messaging/messages',
  TYPING: '/messaging/typing',
  MARK_READ: '/messaging/mark-read',
  EVENT_CONVERSATION: '/messaging/conversations/event',
  BUSINESS_CONVERSATION: '/messaging/conversations/business',
} as const;

// Types matching backend DTOs
export interface CreateConversationDto {
  type: 'direct' | 'group' | 'community';
  title?: string;
  description?: string;
  participantIds: string[];
  contextType?: 'event' | 'business' | 'listing' | 'general';
  contextId?: string;
  metadata?: Record<string, any>;
}

export interface SendMessageDto {
  conversationId: string;
  content: string;
  type?: 'text' | 'image' | 'video' | 'audio' | 'location' | 'file' | 'system';
  replyToMessageId?: string;
  metadata?: {
    imageUrl?: string;
    imageWidth?: number;
    imageHeight?: number;
    videoUrl?: string;
    videoDuration?: number;
    audioUrl?: string;
    audioDuration?: number;
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    location?: {
      latitude: number;
      longitude: number;
      address?: string;
    };
  };
}

export interface UpdateMessageDto {
  content: string;
}

export interface MarkAsReadDto {
  conversationId: string;
  messageId?: string;
}

export interface GetConversationsDto {
  page?: number;
  limit?: number;
  type?: 'direct' | 'group' | 'community';
  contextType?: 'event' | 'business' | 'listing' | 'general';
  isArchived?: boolean;
  search?: string;
}

export interface GetMessagesDto {
  page?: number;
  limit?: number;
  before?: string; // Message ID to get messages before
  after?: string; // Message ID to get messages after
}

export interface TypingIndicatorDto {
  conversationId: string;
  isTyping: boolean;
}

// Response types
export interface MessageResponseDto {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: string;
  replyToMessageId?: string;
  metadata?: Record<string, any>;
  isEdited: boolean;
  editedAt?: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  sender?: {
    id: string;
    firstName: string;
    lastName: string;
    profilePictureUrl?: string;
  };
  replyToMessage?: MessageResponseDto;
}

export interface ConversationParticipantResponseDto {
  id: string;
  userId: string;
  role: 'admin' | 'member';
  isMuted: boolean;
  isPinned: boolean;
  lastReadMessageId?: string;
  lastReadAt?: Date;
  joinedAt: Date;
  leftAt?: Date;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    profilePictureUrl?: string;
    isOnline?: boolean;
    lastSeen?: Date;
  };
}

export interface ConversationResponseDto {
  id: string;
  type: 'direct' | 'group' | 'community';
  title?: string;
  description?: string;
  avatar?: string;
  contextType?: 'event' | 'business' | 'listing' | 'general';
  contextId?: string;
  isArchived: boolean;
  isPinned: boolean;
  lastMessageAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  participants: ConversationParticipantResponseDto[];
  lastMessage?: MessageResponseDto;
  unreadCount: number;
  metadata?: Record<string, any>;
}

export interface PaginatedResponseDto<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ApiResponseDto<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

/**
 * Messaging API Service
 * Handles all messaging-related API calls to the backend
 */
export class MessagingApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = ENV.API.BASE_URL;
  }

  // ========== CONVERSATION METHODS ==========

  /**
   * Get user conversations with pagination and filtering
   */
  async getConversations(query: GetConversationsDto = {}): Promise<PaginatedResponseDto<ConversationResponseDto>> {
    const params = new URLSearchParams();
    
    if (query.page) params.append('page', query.page.toString());
    if (query.limit) params.append('limit', query.limit.toString());
    if (query.type) params.append('type', query.type);
    if (query.contextType) params.append('contextType', query.contextType);
    if (query.isArchived !== undefined) params.append('isArchived', query.isArchived.toString());
    if (query.search) params.append('search', query.search);

    const url = `${MESSAGING_ENDPOINTS.CONVERSATIONS}?${params.toString()}`;
    return await apiClient.get<PaginatedResponseDto<ConversationResponseDto>>(url);
  }

  /**
   * Get specific conversation by ID
   */
  async getConversation(conversationId: string): Promise<ConversationResponseDto> {
    const url = `${MESSAGING_ENDPOINTS.CONVERSATIONS}/${conversationId}`;
    return await apiClient.get<ConversationResponseDto>(url);
  }

  /**
   * Create new conversation
   */
  async createConversation(data: CreateConversationDto): Promise<ConversationResponseDto> {
    return await apiClient.post<ConversationResponseDto>(MESSAGING_ENDPOINTS.CONVERSATIONS, data);
  }

  /**
   * Archive conversation
   */
  async archiveConversation(conversationId: string): Promise<ApiResponseDto<void>> {
    const url = `${MESSAGING_ENDPOINTS.CONVERSATIONS}/${conversationId}/archive`;
    return await apiClient.post<ApiResponseDto<void>>(url);
  }

  /**
   * Pin/unpin conversation
   */
  async pinConversation(conversationId: string): Promise<ApiResponseDto<void>> {
    const url = `${MESSAGING_ENDPOINTS.CONVERSATIONS}/${conversationId}/pin`;
    return await apiClient.post<ApiResponseDto<void>>(url);
  }

  /**
   * Get or create event conversation
   */
  async getOrCreateEventConversation(eventId: string): Promise<ConversationResponseDto> {
    const url = `${MESSAGING_ENDPOINTS.EVENT_CONVERSATION}/${eventId}`;
    return await apiClient.get<ConversationResponseDto>(url);
  }

  /**
   * Get or create business conversation
   */
  async getOrCreateBusinessConversation(businessId: string): Promise<ConversationResponseDto> {
    const url = `${MESSAGING_ENDPOINTS.BUSINESS_CONVERSATION}/${businessId}`;
    return await apiClient.get<ConversationResponseDto>(url);
  }

  // ========== MESSAGE METHODS ==========

  /**
   * Get conversation messages with pagination
   */
  async getMessages(conversationId: string, query: GetMessagesDto = {}): Promise<PaginatedResponseDto<MessageResponseDto>> {
    const params = new URLSearchParams();
    
    if (query.page) params.append('page', query.page.toString());
    if (query.limit) params.append('limit', query.limit.toString());
    if (query.before) params.append('before', query.before);
    if (query.after) params.append('after', query.after);

    const url = `${MESSAGING_ENDPOINTS.CONVERSATIONS}/${conversationId}/messages?${params.toString()}`;
    return await apiClient.get<PaginatedResponseDto<MessageResponseDto>>(url);
  }

  /**
   * Send message
   */
  async sendMessage(data: SendMessageDto): Promise<MessageResponseDto> {
    return await apiClient.post<MessageResponseDto>(MESSAGING_ENDPOINTS.MESSAGES, data);
  }

  /**
   * Edit message
   */
  async editMessage(messageId: string, data: UpdateMessageDto): Promise<MessageResponseDto> {
    const url = `${MESSAGING_ENDPOINTS.MESSAGES}/${messageId}`;
    return await apiClient.put<MessageResponseDto>(url, data);
  }

  /**
   * Delete message
   */
  async deleteMessage(messageId: string): Promise<ApiResponseDto<void>> {
    const url = `${MESSAGING_ENDPOINTS.MESSAGES}/${messageId}`;
    return await apiClient.delete<ApiResponseDto<void>>(url);
  }

  /**
   * Mark messages as read
   */
  async markAsRead(data: MarkAsReadDto): Promise<ApiResponseDto<void>> {
    const url = `${MESSAGING_ENDPOINTS.CONVERSATIONS}/${data.conversationId}/mark-read`;
    return await apiClient.post<ApiResponseDto<void>>(url, data);
  }

  // ========== TYPING INDICATORS ==========

  /**
   * Update typing indicator
   */
  async updateTypingIndicator(data: TypingIndicatorDto): Promise<ApiResponseDto<void>> {
    return await apiClient.post<ApiResponseDto<void>>(MESSAGING_ENDPOINTS.TYPING, data);
  }

  // ========== UTILITY METHODS ==========

  /**
   * Get API health status
   */
  async getHealthStatus(): Promise<ApiResponseDto<{ status: string; timestamp: Date }>> {
    return await apiClient.get<ApiResponseDto<{ status: string; timestamp: Date }>>('/messaging/health');
  }

  /**
   * Get service info
   */
  async getServiceInfo(): Promise<ApiResponseDto<{ service: string; version: string }>> {
    return await apiClient.get<ApiResponseDto<{ service: string; version: string }>>('/messaging');
  }
}

// Export singleton instance
export const messagingApi = new MessagingApiService();

// Export class for testing purposes
export default MessagingApiService;
