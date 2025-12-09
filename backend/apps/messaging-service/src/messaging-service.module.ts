import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
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
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule, // Main database connection
    TypeOrmModule.forFeature([
      Conversation,
      ConversationParticipant,
      Message,
      MessageReceipt,
      TypingIndicator,
      User,
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || configService.get<string>('JWT_ACCESS_SECRET') || 'your-secret-key',
        signOptions: { expiresIn: '1h' },
      }),
      inject: [ConfigService],
    }),
    StorageModule,
  ],
  controllers: [MessagingServiceController],
  providers: [MessagingServiceService, MessagingGateway, WsJwtGuard],
  exports: [MessagingServiceService, MessagingGateway],
})
export class MessagingServiceModule {}
