import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';

// Shared libraries
import { DatabaseModule } from '@app/database';
import { RedisModule } from '@app/database/redis.module';
import { AuthModule } from '@app/auth';
import { StorageModule } from '@app/storage';

// Feature modules (existing service modules)
import { AuthServiceModule } from '../../auth-service/src/auth-service.module';
import { UserServiceModule } from '../../user-service/src/user-service.module';
import { SocialServiceModule } from '../../social-service/src/social-service.module';
import { MessagingServiceModule } from '../../messaging-service/src/messaging-service.module';
import { MarketplaceServiceModule } from '../../marketplace-service/src/marketplace-service.module';
import { EventsServiceModule } from '../../events-service/src/events-service.module';
import { LocationServiceModule } from '../../location-service/src/location-service.module';
import { BusinessServiceModule } from '../../business-service/src/business-service.module';

@Module({
  imports: [
    // Global configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Infrastructure
    DatabaseModule,
    RedisModule,
    StorageModule,

    // Auth infrastructure
    AuthModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRES_IN', '24h'),
        },
      }),
      inject: [ConfigService],
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10,
      },
    ]),

    // Scheduling and events
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),

    // Feature modules
    AuthServiceModule,
    UserServiceModule,
    SocialServiceModule,
    MessagingServiceModule,
    MarketplaceServiceModule,
    EventsServiceModule,
    LocationServiceModule,
    BusinessServiceModule,
  ],
})
export class AppModule {}
