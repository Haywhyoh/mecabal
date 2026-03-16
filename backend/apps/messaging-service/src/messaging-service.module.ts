import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseModule } from '@app/database';
import { StorageModule } from '@app/storage';
import { MessagingServiceController } from './messaging-service.controller';
import { MessagingServiceService } from './messaging-service.service';
import { MessagingGateway } from './messaging.gateway';
import { WsJwtGuard } from './guards/ws-jwt.guard';
import {
  Conversation,
  ConversationParticipant,
  Message,
  MessageReceipt,
  TypingIndicator
} from './entities';
import { User } from '@app/database';

@Module({
  imports: [
    DatabaseModule,
    TypeOrmModule.forFeature([
      Conversation,
      ConversationParticipant,
      Message,
      MessageReceipt,
      TypingIndicator,
      User,
    ]),
    StorageModule,
  ],
  controllers: [MessagingServiceController],
  providers: [MessagingServiceService, MessagingGateway, WsJwtGuard],
  exports: [MessagingServiceService, MessagingGateway],
})
export class MessagingServiceModule {}
