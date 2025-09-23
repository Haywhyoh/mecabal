import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '@app/database';
import { SocialServiceController } from './social-service.controller';
import { SocialServiceService } from './social-service.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
  ],
  controllers: [SocialServiceController],
  providers: [SocialServiceService],
})
export class SimpleSocialServiceModule {}
