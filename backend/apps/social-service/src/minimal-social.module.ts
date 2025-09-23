import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '@app/database';
import { SocialServiceController } from './social-service.controller';
import { SocialServiceService } from './social-service.service';
import { PostsModule } from './posts/posts.module';

// Create a minimal working social service using the shared database module
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    PostsModule,
  ],
  controllers: [SocialServiceController],
  providers: [SocialServiceService],
})
export class MinimalSocialModule {}
