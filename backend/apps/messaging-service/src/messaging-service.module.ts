import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
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

@Module({
  imports: [
    DatabaseModule, // Main database connection
    TypeOrmModule.forFeature([
      Conversation,
      ConversationParticipant,
      Message,
      MessageReceipt,
      TypingIndicator,
    ]),
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '1h' },
    }),
    StorageModule,
  ],
  controllers: [MessagingServiceController],
  providers: [MessagingServiceService, MessagingGateway, WsJwtGuard],
  exports: [MessagingServiceService, MessagingGateway],
})
export class MessagingServiceModule {}
