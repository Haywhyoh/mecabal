# In-App Messaging Backend Integration Plan

## Executive Summary

This document provides a comprehensive plan to upgrade the MeCabal messaging system from its current **mock data implementation** to a fully functional **backend-integrated real-time messaging platform**. The plan covers integration points with Events and Marketplace (Business Listings), backend API development, WebSocket implementation, and frontend updates.

---

## Table of Contents

1. [Current State Analysis](#current-state-analysis)
2. [Integration Points](#integration-points)
3. [Backend Architecture](#backend-architecture)
4. [Implementation Tasks](#implementation-tasks)
5. [Testing Strategy](#testing-strategy)
6. [Deployment Plan](#deployment-plan)

---

## Current State Analysis

### What We Have (Frontend)

✅ **MessagingService.ts** - Fully functional mock service with:
- Direct messaging (1-on-1)
- Group chats
- Community channels
- Typing indicators
- Message status tracking
- Online/offline status
- Pin/Archive functionality
- Event emitter pattern for real-time updates

✅ **ChatScreen.tsx** - Complete chat interface with:
- Message bubbles (sent/received)
- Media message support (images, audio, location)
- Reply functionality
- Edit/Delete messages
- Typing indicators
- Read receipts
- System messages

✅ **MessagingScreen.tsx** - Conversations list with:
- Conversation previews
- Unread badges
- Search functionality
- Online status indicators
- Last message preview

### What's Missing (Backend)

❌ **No API endpoints** - All data is currently mock/demo
❌ **No WebSocket server** - Real-time updates are simulated
❌ **No database schema** - Messages not persisted
❌ **No authentication** - Using hardcoded user IDs
❌ **No media storage** - Image/audio uploads not implemented
❌ **No push notifications** - No background message alerts

### Integration Gaps

🔴 **EventDetailsScreen.tsx** (Line 338-349):
```typescript
const handleContact = () => {
  Alert.alert(
    'Contact Organizer',
    'How would you like to contact the organizer?',
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Message', onPress: () => console.log('Open message') }, // ❌ NOT CONNECTED
      { text: 'Call', onPress: () => console.log('Open phone') },      // ❌ NOT CONNECTED
    ]
  );
};
```

🔴 **BusinessDetailScreen.tsx** (Lines 178-190):
```typescript
{business.phoneNumber && (
  <TouchableOpacity style={styles.contactButton} onPress={handleCall}>
    <Ionicons name="call" size={20} color={colors.white} />
    <Text style={styles.contactButtonText}>Call</Text>
  </TouchableOpacity>
)}
{business.whatsappNumber && (
  <TouchableOpacity style={styles.whatsappButton} onPress={handleWhatsApp}>
    <Ionicons name="logo-whatsapp" size={20} color={colors.white} />
    <Text style={styles.contactButtonText}>WhatsApp</Text>
  </TouchableOpacity>
)}
```
**Missing**: Direct "Message" button to start in-app conversation

---

## Integration Points

### 1. Event Organizer Messaging

**Use Case**: User wants to message event organizer

**Flow**:
1. User views EventDetailsScreen
2. Taps "Contact Organizer" → "Message"
3. System checks if conversation exists with organizer
4. If exists → Navigate to existing conversation
5. If not → Create new conversation → Navigate to chat
6. User sends message to organizer

**Required**:
- Create conversation with event context (eventId in metadata)
- Pre-fill first message template: "Hi! I'm interested in your event: [Event Title]"
- Link conversation to event for context

---

### 2. Business Inquiry Messaging

**Use Case**: User wants to contact business owner about a service

**Flow**:
1. User views BusinessDetailScreen
2. Taps "Message" button
3. System checks if conversation exists with business owner
4. If exists → Navigate to existing conversation
5. If not → Create new conversation → Navigate to chat
6. Pre-fill message: "Hi! I'm interested in your services. I'd like to inquire about..."
7. User sends message

**Required**:
- Create conversation with business context (businessId in metadata)
- Business badge/indicator in conversation list
- Link to business profile from conversation

---

### 3. Marketplace Listing Inquiries

**Use Case**: User inquires about a marketplace item

**Flow**:
1. User views Marketplace listing
2. Taps "Contact Seller" button
3. System creates/opens conversation with seller
4. Pre-fill message with listing details
5. User sends inquiry

**Required**:
- Listing preview in conversation (like event preview)
- Quick access to listing from chat
- Mark inquiry as "about listing #123"

---

## Backend Architecture

### Technology Stack

**Backend Framework**: NestJS (already in use)
**Database**: PostgreSQL (already in use)
**Real-time**: Socket.IO / WebSocket
**Message Queue**: RabbitMQ (already available)
**File Storage**: MinIO (already available for media)
**Push Notifications**: Firebase Cloud Messaging (FCM)

---

### Database Schema

#### **Table: conversations**
```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(20) NOT NULL CHECK (type IN ('direct', 'group', 'community')),
  title VARCHAR(255),
  description TEXT,
  avatar_url VARCHAR(500),

  -- Context (what this conversation is about)
  context_type VARCHAR(50), -- 'event', 'business', 'listing', 'general'
  context_id UUID,           -- ID of event/business/listing

  -- Metadata
  is_archived BOOLEAN DEFAULT FALSE,
  creator_id UUID REFERENCES users(id),

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_message_at TIMESTAMP,

  -- Indexes
  INDEX idx_conversations_context (context_type, context_id),
  INDEX idx_conversations_updated (updated_at DESC),
  INDEX idx_conversations_last_message (last_message_at DESC)
);
```

#### **Table: conversation_participants**
```sql
CREATE TABLE conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Participant metadata
  role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  is_muted BOOLEAN DEFAULT FALSE,
  is_pinned BOOLEAN DEFAULT FALSE,

  -- Last read tracking
  last_read_message_id UUID,
  last_read_at TIMESTAMP,
  unread_count INTEGER DEFAULT 0,

  -- Timestamps
  joined_at TIMESTAMP DEFAULT NOW(),
  left_at TIMESTAMP,

  -- Indexes
  UNIQUE(conversation_id, user_id),
  INDEX idx_participant_user (user_id),
  INDEX idx_participant_unread (user_id, unread_count) WHERE unread_count > 0
);
```

#### **Table: messages**
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id),

  -- Message content
  content TEXT NOT NULL,
  type VARCHAR(20) DEFAULT 'text' CHECK (type IN ('text', 'image', 'video', 'audio', 'location', 'file', 'system')),

  -- Reply/Thread
  reply_to_message_id UUID REFERENCES messages(id),

  -- Media metadata (JSONB for flexibility)
  metadata JSONB,
  -- Example: {"image_url": "...", "image_width": 800, "image_height": 600}
  -- Example: {"location": {"lat": 6.5244, "lng": 3.3792, "address": "Lagos"}}
  -- Example: {"audio_url": "...", "duration": 45}

  -- Status
  is_edited BOOLEAN DEFAULT FALSE,
  edited_at TIMESTAMP,
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Indexes
  INDEX idx_messages_conversation (conversation_id, created_at DESC),
  INDEX idx_messages_sender (sender_id),
  INDEX idx_messages_reply (reply_to_message_id) WHERE reply_to_message_id IS NOT NULL,
  INDEX idx_messages_search (conversation_id, content) USING gin(to_tsvector('english', content))
);
```

#### **Table: message_receipts**
```sql
CREATE TABLE message_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Status
  status VARCHAR(20) NOT NULL CHECK (status IN ('sent', 'delivered', 'read')),
  timestamp TIMESTAMP DEFAULT NOW(),

  -- Indexes
  UNIQUE(message_id, user_id),
  INDEX idx_receipts_message (message_id),
  INDEX idx_receipts_user_unread (user_id, status) WHERE status != 'read'
);
```

#### **Table: typing_indicators**
```sql
CREATE TABLE typing_indicators (
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  is_typing BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Expires after 5 seconds of inactivity
  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '5 seconds',

  PRIMARY KEY (conversation_id, user_id),
  INDEX idx_typing_active (conversation_id, expires_at) WHERE is_typing = TRUE
);
```

---

## Implementation Tasks

### PHASE 1: Backend Foundation (2-3 weeks)

#### TASK 1.1: Create Messaging Microservice 🏗️

**Priority**: HIGH
**Time**: 3 days

**Steps**:

1. **Generate NestJS Messaging Service**
```bash
cd backend
nest generate app messaging
```

2. **Install Dependencies**
```bash
npm install @nestjs/websockets @nestjs/platform-socket.io socket.io
npm install @nestjs/typeorm typeorm pg
npm install class-validator class-transformer
```

3. **Create Module Structure**
```
backend/apps/messaging/
├── src/
│   ├── main.ts
│   ├── messaging.module.ts
│   ├── messaging.controller.ts
│   ├── messaging.service.ts
│   ├── messaging.gateway.ts           # WebSocket gateway
│   ├── entities/
│   │   ├── conversation.entity.ts
│   │   ├── message.entity.ts
│   │   ├── conversation-participant.entity.ts
│   │   ├── message-receipt.entity.ts
│   │   └── typing-indicator.entity.ts
│   ├── dto/
│   │   ├── create-conversation.dto.ts
│   │   ├── send-message.dto.ts
│   │   ├── update-message.dto.ts
│   │   └── mark-as-read.dto.ts
│   ├── repositories/
│   │   ├── conversation.repository.ts
│   │   ├── message.repository.ts
│   │   └── participant.repository.ts
│   └── interfaces/
│       ├── conversation.interface.ts
│       └── message.interface.ts
```

4. **Configure in `nest-cli.json`**
```json
{
  "projects": {
    "messaging": {
      "type": "application",
      "root": "apps/messaging",
      "entryFile": "main",
      "sourceRoot": "apps/messaging/src"
    }
  }
}
```

**Deliverable**: Messaging microservice scaffold with folder structure

---

#### TASK 1.2: Create Database Entities 📊

**Priority**: HIGH
**Time**: 2 days

**File**: `backend/apps/messaging/src/entities/conversation.entity.ts`

```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from '@app/database/entities/user.entity';

export enum ConversationType {
  DIRECT = 'direct',
  GROUP = 'group',
  COMMUNITY = 'community',
}

export enum ContextType {
  EVENT = 'event',
  BUSINESS = 'business',
  LISTING = 'listing',
  GENERAL = 'general',
}

@Entity('conversations')
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: ConversationType,
  })
  type: ConversationType;

  @Column({ nullable: true })
  title?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'avatar_url', nullable: true })
  avatarUrl?: string;

  // Context - What this conversation is about
  @Column({
    type: 'enum',
    enum: ContextType,
    name: 'context_type',
    nullable: true,
  })
  contextType?: ContextType;

  @Column({ name: 'context_id', type: 'uuid', nullable: true })
  contextId?: string;

  @Column({ name: 'is_archived', default: false })
  isArchived: boolean;

  @Column({ name: 'creator_id', type: 'uuid' })
  creatorId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'creator_id' })
  creator: User;

  @OneToMany(() => ConversationParticipant, (participant) => participant.conversation, { cascade: true })
  participants: ConversationParticipant[];

  @OneToMany(() => Message, (message) => message.conversation, { cascade: true })
  messages: Message[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'last_message_at', type: 'timestamp', nullable: true })
  lastMessageAt?: Date;
}
```

**File**: `backend/apps/messaging/src/entities/message.entity.ts`

```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from '@app/database/entities/user.entity';
import { Conversation } from './conversation.entity';

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  LOCATION = 'location',
  FILE = 'file',
  SYSTEM = 'system',
}

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'conversation_id', type: 'uuid' })
  conversationId: string;

  @ManyToOne(() => Conversation, (conversation) => conversation.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversation_id' })
  conversation: Conversation;

  @Column({ name: 'sender_id', type: 'uuid' })
  senderId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'sender_id' })
  sender: User;

  @Column({ type: 'text' })
  content: string;

  @Column({
    type: 'enum',
    enum: MessageType,
    default: MessageType.TEXT,
  })
  type: MessageType;

  @Column({ name: 'reply_to_message_id', type: 'uuid', nullable: true })
  replyToMessageId?: string;

  @ManyToOne(() => Message, { nullable: true })
  @JoinColumn({ name: 'reply_to_message_id' })
  replyToMessage?: Message;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @Column({ name: 'is_edited', default: false })
  isEdited: boolean;

  @Column({ name: 'edited_at', type: 'timestamp', nullable: true })
  editedAt?: Date;

  @Column({ name: 'is_deleted', default: false })
  isDeleted: boolean;

  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt?: Date;

  @OneToMany(() => MessageReceipt, (receipt) => receipt.message, { cascade: true })
  receipts: MessageReceipt[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
```

**Deliverable**: TypeORM entities matching database schema

---

#### TASK 1.3: Create DTOs and Validation 📝

**Priority**: HIGH
**Time**: 1 day

**File**: `backend/apps/messaging/src/dto/create-conversation.dto.ts`

```typescript
import { IsEnum, IsOptional, IsString, IsArray, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ConversationType, ContextType } from '../entities/conversation.entity';

export class CreateConversationDto {
  @IsEnum(ConversationType)
  type: ConversationType;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  @IsUUID('4', { each: true })
  participantIds: string[];

  @IsOptional()
  @IsEnum(ContextType)
  contextType?: ContextType;

  @IsOptional()
  @IsUUID('4')
  contextId?: string;
}
```

**File**: `backend/apps/messaging/src/dto/send-message.dto.ts`

```typescript
import { IsUUID, IsString, IsEnum, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { MessageType } from '../entities/message.entity';

export class MessageMetadataDto {
  @IsOptional()
  imageUrl?: string;

  @IsOptional()
  imageWidth?: number;

  @IsOptional()
  imageHeight?: number;

  @IsOptional()
  audioUrl?: string;

  @IsOptional()
  audioDuration?: number;

  @IsOptional()
  @ValidateNested()
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
}

export class SendMessageDto {
  @IsUUID('4')
  conversationId: string;

  @IsString()
  content: string;

  @IsEnum(MessageType)
  @IsOptional()
  type?: MessageType = MessageType.TEXT;

  @IsOptional()
  @IsUUID('4')
  replyToMessageId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => MessageMetadataDto)
  metadata?: MessageMetadataDto;
}
```

**Deliverable**: Validated DTOs for all API operations

---

#### TASK 1.4: Implement REST API Endpoints 🔌

**Priority**: HIGH
**Time**: 3 days

**File**: `backend/apps/messaging/src/messaging.controller.ts`

```typescript
import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '@app/auth/guards/jwt-auth.guard';
import { MessagingService } from './messaging.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';

@Controller('messaging')
@UseGuards(JwtAuthGuard)
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  // ========== CONVERSATIONS ==========

  @Get('conversations')
  async getConversations(
    @Req() req,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    const userId = req.user.id;
    return this.messagingService.getUserConversations(userId, page, limit);
  }

  @Get('conversations/:id')
  async getConversation(
    @Req() req,
    @Param('id') conversationId: string,
  ) {
    const userId = req.user.id;
    return this.messagingService.getConversation(conversationId, userId);
  }

  @Post('conversations')
  async createConversation(
    @Req() req,
    @Body() dto: CreateConversationDto,
  ) {
    const userId = req.user.id;
    return this.messagingService.createConversation(userId, dto);
  }

  @Post('conversations/:id/archive')
  async archiveConversation(
    @Req() req,
    @Param('id') conversationId: string,
  ) {
    const userId = req.user.id;
    return this.messagingService.archiveConversation(conversationId, userId);
  }

  @Post('conversations/:id/pin')
  async pinConversation(
    @Req() req,
    @Param('id') conversationId: string,
  ) {
    const userId = req.user.id;
    return this.messagingService.pinConversation(conversationId, userId);
  }

  // ========== MESSAGES ==========

  @Get('conversations/:id/messages')
  async getMessages(
    @Req() req,
    @Param('id') conversationId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
  ) {
    const userId = req.user.id;
    return this.messagingService.getMessages(conversationId, userId, page, limit);
  }

  @Post('messages')
  async sendMessage(
    @Req() req,
    @Body() dto: SendMessageDto,
  ) {
    const userId = req.user.id;
    return this.messagingService.sendMessage(userId, dto);
  }

  @Put('messages/:id')
  async editMessage(
    @Req() req,
    @Param('id') messageId: string,
    @Body('content') content: string,
  ) {
    const userId = req.user.id;
    return this.messagingService.editMessage(messageId, userId, content);
  }

  @Delete('messages/:id')
  async deleteMessage(
    @Req() req,
    @Param('id') messageId: string,
  ) {
    const userId = req.user.id;
    return this.messagingService.deleteMessage(messageId, userId);
  }

  @Post('conversations/:id/mark-read')
  async markAsRead(
    @Req() req,
    @Param('id') conversationId: string,
    @Body('messageId') messageId?: string,
  ) {
    const userId = req.user.id;
    return this.messagingService.markAsRead(conversationId, userId, messageId);
  }

  // ========== SEARCH ==========

  @Get('search')
  async searchMessages(
    @Req() req,
    @Query('q') query: string,
    @Query('page') page: number = 1,
  ) {
    const userId = req.user.id;
    return this.messagingService.searchMessages(userId, query, page);
  }

  // ========== CONTEXT-BASED CONVERSATIONS ==========

  @Get('conversations/event/:eventId')
  async getOrCreateEventConversation(
    @Req() req,
    @Param('eventId') eventId: string,
    @Query('organizerId') organizerId: string,
  ) {
    const userId = req.user.id;
    return this.messagingService.getOrCreateEventConversation(userId, eventId, organizerId);
  }

  @Get('conversations/business/:businessId')
  async getOrCreateBusinessConversation(
    @Req() req,
    @Param('businessId') businessId: string,
    @Query('ownerId') ownerId: string,
  ) {
    const userId = req.user.id;
    return this.messagingService.getOrCreateBusinessConversation(userId, businessId, ownerId);
  }
}
```

**Deliverable**: Complete REST API with all CRUD operations

---

### PHASE 2: Real-Time WebSocket Implementation (1-2 weeks)

#### TASK 2.1: Implement WebSocket Gateway 🔄

**Priority**: HIGH
**Time**: 3 days

**File**: `backend/apps/messaging/src/messaging.gateway.ts`

```typescript
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { WsJwtGuard } from '@app/auth/guards/ws-jwt.guard';
import { MessagingService } from './messaging.service';

@WebSocketGateway({
  cors: {
    origin: '*', // Configure properly in production
    credentials: true,
  },
  namespace: '/messaging',
})
@UseGuards(WsJwtGuard)
export class MessagingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSockets: Map<string, Set<string>> = new Map(); // userId -> Set<socketId>

  constructor(private readonly messagingService: MessagingService) {}

  async handleConnection(client: Socket) {
    try {
      const userId = client.data.userId; // Set by WsJwtGuard

      // Add socket to user's socket set
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId).add(client.id);

      // Join user to their conversation rooms
      const conversations = await this.messagingService.getUserConversationIds(userId);
      conversations.forEach(convId => {
        client.join(`conversation:${convId}`);
      });

      // Broadcast user online status
      this.broadcastUserStatus(userId, true);

      console.log(`✅ User ${userId} connected (socket: ${client.id})`);
    } catch (error) {
      console.error('Connection error:', error);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const userId = client.data.userId;

    if (userId && this.userSockets.has(userId)) {
      const sockets = this.userSockets.get(userId);
      sockets.delete(client.id);

      // If no more sockets for this user, mark as offline
      if (sockets.size === 0) {
        this.userSockets.delete(userId);
        this.broadcastUserStatus(userId, false);
      }
    }

    console.log(`❌ User ${userId} disconnected (socket: ${client.id})`);
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    const userId = client.data.userId;

    try {
      // Send message via service
      const message = await this.messagingService.sendMessage(userId, data);

      // Emit to conversation room
      this.server
        .to(`conversation:${data.conversationId}`)
        .emit('newMessage', message);

      // Update conversation in participants' lists
      this.server
        .to(`conversation:${data.conversationId}`)
        .emit('conversationUpdated', {
          conversationId: data.conversationId,
          lastMessage: message,
          updatedAt: new Date(),
        });

      return { success: true, message };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('typing')
  async handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; isTyping: boolean },
  ) {
    const userId = client.data.userId;

    // Broadcast to conversation room (except sender)
    client.to(`conversation:${data.conversationId}`).emit('userTyping', {
      conversationId: data.conversationId,
      userId,
      isTyping: data.isTyping,
    });
  }

  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; messageId?: string },
  ) {
    const userId = client.data.userId;

    try {
      await this.messagingService.markAsRead(data.conversationId, userId, data.messageId);

      // Emit read receipt to conversation
      this.server
        .to(`conversation:${data.conversationId}`)
        .emit('messageRead', {
          conversationId: data.conversationId,
          userId,
          messageId: data.messageId,
        });

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('joinConversation')
  async handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    client.join(`conversation:${data.conversationId}`);
    return { success: true };
  }

  @SubscribeMessage('leaveConversation')
  async handleLeaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    client.leave(`conversation:${data.conversationId}`);
    return { success: true };
  }

  // Utility methods

  private broadcastUserStatus(userId: string, isOnline: boolean) {
    this.server.emit('userStatusChanged', {
      userId,
      isOnline,
      timestamp: new Date(),
    });
  }

  async notifyNewMessage(conversationId: string, message: any) {
    this.server
      .to(`conversation:${conversationId}`)
      .emit('newMessage', message);
  }

  async notifyMessageUpdated(conversationId: string, message: any) {
    this.server
      .to(`conversation:${conversationId}`)
      .emit('messageUpdated', message);
  }

  async notifyMessageDeleted(conversationId: string, messageId: string) {
    this.server
      .to(`conversation:${conversationId}`)
      .emit('messageDeleted', { messageId, conversationId });
  }
}
```

**Deliverable**: Real-time WebSocket gateway with connection management

---

#### TASK 2.2: Create WebSocket Authentication Guard 🔐

**Priority**: HIGH
**Time**: 1 day

**File**: `backend/libs/auth/src/guards/ws-jwt.guard.ts`

```typescript
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client: Socket = context.switchToWs().getClient();
      const token = this.extractTokenFromHandshake(client);

      if (!token) {
        return false;
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_ACCESS_SECRET,
      });

      // Attach user data to socket
      client.data.userId = payload.sub;
      client.data.user = payload;

      return true;
    } catch {
      return false;
    }
  }

  private extractTokenFromHandshake(client: Socket): string | undefined {
    const token =
      client.handshake.auth.token ||
      client.handshake.headers.authorization?.split(' ')[1];

    return token;
  }
}
```

**Deliverable**: Secure WebSocket authentication

---

### PHASE 3: Frontend Integration (2 weeks)

#### TASK 3.1: Update MessagingService with Real Backend 🔌

**Priority**: HIGH
**Time**: 3 days

**File**: `Hommie_Mobile/src/services/MessagingService.ts`

**Changes Required**:

1. **Add API configuration**
```typescript
import { ENV, API_ENDPOINTS } from '../config/environment';
import io, { Socket } from 'socket.io-client';
import { MeCabalAuth } from './auth';

export class MessagingService extends SimpleEventEmitter {
  private static instance: MessagingService;
  private socket: Socket | null = null;
  private baseUrl: string;
  private currentUserId: string | null = null;

  private constructor() {
    super();
    this.baseUrl = ENV.API.BASE_URL;
    this.initializeWebSocket();
  }

  private async initializeWebSocket() {
    const token = await MeCabalAuth.getAuthToken();
    const user = await MeCabalAuth.getCurrentUser();

    if (!token || !user) {
      console.error('Cannot initialize WebSocket: No auth token');
      return;
    }

    this.currentUserId = user.id;

    this.socket = io(`${this.baseUrl}/messaging`, {
      auth: {
        token,
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.setupSocketListeners();
  }

  private setupSocketListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected');
      this.isConnected = true;
      this.emit('connected');
    });

    this.socket.on('disconnect', () => {
      console.log('❌ WebSocket disconnected');
      this.isConnected = false;
      this.emit('disconnected');
    });

    this.socket.on('newMessage', (message) => {
      this.handleNewMessage(message);
    });

    this.socket.on('messageUpdated', (message) => {
      this.emit('messageEdited', message);
    });

    this.socket.on('messageDeleted', ({ messageId, conversationId }) => {
      this.emit('messageDeleted', messageId, conversationId);
    });

    this.socket.on('userTyping', ({ conversationId, userId, isTyping }) => {
      this.handleTypingStatus(conversationId, userId, isTyping);
    });

    this.socket.on('userStatusChanged', ({ userId, isOnline }) => {
      this.handleUserStatusChanged(userId, isOnline);
    });

    this.socket.on('conversationUpdated', (data) => {
      this.emit('conversationUpdated', data);
    });
  }
}
```

2. **Replace mock methods with API calls**
```typescript
public async getConversations(): Promise<Conversation[]> {
  try {
    const token = await MeCabalAuth.getAuthToken();
    const response = await fetch(`${this.baseUrl}/messaging/conversations`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) throw new Error('Failed to fetch conversations');

    const data = await response.json();
    return data.conversations;
  } catch (error) {
    console.error('Error fetching conversations:', error);
    throw error;
  }
}

public async sendMessage(
  conversationId: string,
  content: string,
  type: MessageType = 'text',
  metadata?: any
): Promise<Message> {
  return new Promise((resolve, reject) => {
    if (!this.socket?.connected) {
      reject(new Error('WebSocket not connected'));
      return;
    }

    this.socket.emit('sendMessage', {
      conversationId,
      content,
      type,
      metadata,
    }, (response: any) => {
      if (response.success) {
        resolve(response.message);
      } else {
        reject(new Error(response.error));
      }
    });
  });
}
```

**Deliverable**: Real backend-connected MessagingService

---

#### TASK 3.2: Connect Event Organizer Messaging 🎉

**Priority**: HIGH
**Time**: 1 day

**File**: `Hommie_Mobile/src/screens/EventDetailsScreen.tsx`

**Update handleContact function** (Lines 338-349):

```typescript
const handleContact = () => {
  Alert.alert(
    'Contact Organizer',
    'How would you like to contact the organizer?',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Message',
        onPress: async () => {
          try {
            // Get or create conversation with event organizer
            const messagingService = MessagingService.getInstance();
            const conversation = await messagingService.getOrCreateEventConversation(
              event.id,
              event.organizer.id,
              event.title
            );

            // Navigate to chat
            navigation.navigate('Chat', {
              conversationId: conversation.id,
              conversationType: 'direct',
              conversationTitle: event.organizer.fullName,
              contextType: 'event',
              contextId: event.id,
            });
          } catch (error) {
            Alert.alert('Error', 'Failed to open chat. Please try again.');
          }
        },
      },
      {
        text: 'Call',
        onPress: () => {
          if (event.organizer.phoneNumber) {
            Linking.openURL(`tel:${event.organizer.phoneNumber}`);
          } else {
            Alert.alert('No Phone Number', 'This organizer has not shared a phone number.');
          }
        },
      },
    ]
  );
};
```

**Add method to MessagingService**:

```typescript
public async getOrCreateEventConversation(
  eventId: string,
  organizerId: string,
  eventTitle: string
): Promise<Conversation> {
  try {
    const token = await MeCabalAuth.getAuthToken();
    const response = await fetch(
      `${this.baseUrl}/messaging/conversations/event/${eventId}?organizerId=${organizerId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) throw new Error('Failed to get/create conversation');

    const conversation = await response.json();

    // Join conversation room via WebSocket
    if (this.socket?.connected) {
      this.socket.emit('joinConversation', { conversationId: conversation.id });
    }

    return conversation;
  } catch (error) {
    console.error('Error getting event conversation:', error);
    throw error;
  }
}
```

**Deliverable**: Event organizer messaging fully functional

---

#### TASK 3.3: Connect Business Owner Messaging 💼

**Priority**: HIGH
**Time**: 1 day

**File**: `Hommie_Mobile/src/screens/BusinessDetailScreen.tsx`

**Add Message Button** (After WhatsApp button, around line 191):

```typescript
const handleMessage = async () => {
  try {
    const messagingService = MessagingService.getInstance();
    const conversation = await messagingService.getOrCreateBusinessConversation(
      businessId,
      business.ownerId,
      business.businessName
    );

    navigation.navigate('Chat', {
      conversationId: conversation.id,
      conversationType: 'direct',
      conversationTitle: business.businessName,
      contextType: 'business',
      contextId: businessId,
    });
  } catch (error) {
    Alert.alert('Error', 'Failed to open chat. Please try again.');
  }
};

// Add Message button to contact buttons section
<View style={styles.contactButtons}>
  <TouchableOpacity style={styles.messageButton} onPress={handleMessage}>
    <Ionicons name="chatbubble" size={20} color={colors.white} />
    <Text style={styles.contactButtonText}>Message</Text>
  </TouchableOpacity>

  {business.phoneNumber && (
    <TouchableOpacity style={styles.contactButton} onPress={handleCall}>
      <Ionicons name="call" size={20} color={colors.white} />
      <Text style={styles.contactButtonText}>Call</Text>
    </TouchableOpacity>
  )}

  {business.whatsappNumber && (
    <TouchableOpacity style={styles.whatsappButton} onPress={handleWhatsApp}>
      <Ionicons name="logo-whatsapp" size={20} color={colors.white} />
      <Text style={styles.contactButtonText}>WhatsApp</Text>
    </TouchableOpacity>
  )}
</View>
```

**Add styles**:

```typescript
messageButton: {
  flex: 1,
  backgroundColor: colors.primary,
  paddingVertical: 12,
  paddingHorizontal: 16,
  borderRadius: 8,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: 8,
},
```

**Deliverable**: Business owner messaging fully functional

---

### PHASE 4: Advanced Features (2 weeks)

#### TASK 4.1: Media Upload Integration 📸

**Priority**: MEDIUM
**Time**: 3 days

**Backend** - Create media upload endpoint:

```typescript
@Post('media/upload')
@UseInterceptors(FileInterceptor('file'))
async uploadMedia(@UploadedFile() file: Express.Multer.File, @Req() req) {
  // Upload to MinIO
  const url = await this.minioService.uploadFile(file, 'messaging');
  return { url };
}
```

**Frontend** - Update ChatScreen to handle media:

```typescript
import * as ImagePicker from 'expo-image-picker';

const handleAttachmentPress = async () => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (status !== 'granted') {
    Alert.alert('Permission needed', 'Please allow access to your photos');
    return;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.8,
  });

  if (!result.canceled && result.assets[0]) {
    const asset = result.assets[0];

    // Upload image
    const formData = new FormData();
    formData.append('file', {
      uri: asset.uri,
      type: 'image/jpeg',
      name: 'photo.jpg',
    } as any);

    const token = await MeCabalAuth.getAuthToken();
    const response = await fetch(`${ENV.API.BASE_URL}/messaging/media/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    const { url } = await response.json();

    // Send as image message
    await messagingService.sendMessage(conversationId, 'Photo', 'image', {
      imageUrl: url,
      imageWidth: asset.width,
      imageHeight: asset.height,
    });
  }
};
```

**Deliverable**: Image/media upload working

---

#### TASK 4.2: Push Notifications 🔔

**Priority**: MEDIUM
**Time**: 4 days

**Backend** - Integrate FCM:

```typescript
import * as admin from 'firebase-admin';

@Injectable()
export class PushNotificationService {
  async sendMessageNotification(userId: string, message: Message) {
    // Get user's FCM tokens
    const tokens = await this.getUserFCMTokens(userId);

    if (tokens.length === 0) return;

    const notification = {
      title: message.senderName,
      body: message.type === 'text' ? message.content : `Sent a ${message.type}`,
      data: {
        conversationId: message.conversationId,
        messageId: message.id,
        type: 'new_message',
      },
    };

    await admin.messaging().sendMulticast({
      tokens,
      notification,
      android: {
        priority: 'high',
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    });
  }
}
```

**Frontend** - Handle notifications:

```typescript
import * as Notifications from 'expo-notifications';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Handle notification tap
Notifications.addNotificationResponseReceivedListener(response => {
  const data = response.notification.request.content.data;

  if (data.type === 'new_message') {
    navigation.navigate('Chat', {
      conversationId: data.conversationId,
    });
  }
});
```

**Deliverable**: Push notifications working

---

## Testing Strategy

### Unit Tests

```typescript
describe('MessagingService', () => {
  it('should create a direct conversation', async () => {
    const conversation = await service.createConversation(userId, {
      type: ConversationType.DIRECT,
      participantIds: [otherUserId],
    });

    expect(conversation.type).toBe(ConversationType.DIRECT);
    expect(conversation.participants).toHaveLength(2);
  });

  it('should send a message', async () => {
    const message = await service.sendMessage(userId, {
      conversationId,
      content: 'Hello!',
      type: MessageType.TEXT,
    });

    expect(message.content).toBe('Hello!');
    expect(message.senderId).toBe(userId);
  });

  it('should mark messages as read', async () => {
    await service.markAsRead(conversationId, userId);

    const participant = await service.getParticipant(conversationId, userId);
    expect(participant.unreadCount).toBe(0);
  });
});
```

### Integration Tests

```typescript
describe('MessagingController (e2e)', () => {
  it('POST /messaging/conversations', async () => {
    return request(app.getHttpServer())
      .post('/messaging/conversations')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'direct',
        participantIds: [otherUserId],
      })
      .expect(201)
      .expect(res => {
        expect(res.body.id).toBeDefined();
      });
  });
});
```

### WebSocket Tests

```typescript
describe('MessagingGateway', () => {
  it('should emit newMessage event', (done) => {
    const client = io(`http://localhost:3004/messaging`, {
      auth: { token },
    });

    client.on('newMessage', (message) => {
      expect(message.content).toBe('Test message');
      client.disconnect();
      done();
    });

    client.emit('sendMessage', {
      conversationId,
      content: 'Test message',
    });
  });
});
```

---

## Deployment Plan

### Environment Variables

```bash
# Messaging Service
MESSAGING_PORT=3004
MESSAGING_WS_PORT=3005

# WebSocket
WS_CORS_ORIGIN=*

# Database
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=mecabal_messaging
POSTGRES_USER=mecabal
POSTGRES_PASSWORD=

# Redis (for WebSocket scaling)
REDIS_HOST=localhost
REDIS_PORT=6379

# MinIO (Media storage)
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=
MINIO_SECRET_KEY=

# Firebase (Push notifications)
FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY=
FIREBASE_CLIENT_EMAIL=
```

### Docker Compose

```yaml
messaging:
  build:
    context: .
    dockerfile: apps/messaging/Dockerfile
  ports:
    - "3004:3004"
    - "3005:3005"
  environment:
    - NODE_ENV=production
  depends_on:
    - postgres
    - redis
    - minio
```

---

## Timeline Summary

| Phase | Duration | Tasks |
|-------|----------|-------|
| Phase 1: Backend Foundation | 2-3 weeks | Database, API, Entities |
| Phase 2: WebSocket | 1-2 weeks | Real-time messaging |
| Phase 3: Frontend Integration | 2 weeks | Connect UI to backend |
| Phase 4: Advanced Features | 2 weeks | Media, notifications |
| **TOTAL** | **7-9 weeks** | Full implementation |

---

## Success Metrics

✅ **Functional Requirements**:
- [ ] Users can send/receive messages in real-time
- [ ] Event organizers receive inquiries
- [ ] Business owners receive customer messages
- [ ] Media messages work (images, audio)
- [ ] Push notifications delivered

✅ **Performance**:
- [ ] Message delivery < 500ms
- [ ] WebSocket connection stable
- [ ] Handle 1000+ concurrent users
- [ ] Database queries optimized

✅ **User Experience**:
- [ ] Typing indicators work
- [ ] Read receipts accurate
- [ ] Offline messages queued
- [ ] Smooth scrolling in chat

---

**Document Version**: 1.0
**Last Updated**: 2025-10-14
**Status**: Ready for Implementation
**Next Steps**: Start Phase 1 - Backend Foundation
