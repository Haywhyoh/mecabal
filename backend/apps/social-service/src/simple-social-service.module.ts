import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '@app/database';
import { AuthModule } from '@app/auth';
import { SocialServiceController } from './social-service.controller';
import { SocialServiceService } from './social-service.service';
import { PostsModule } from './posts/posts.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    AuthModule,
    PostsModule,
  ],
  controllers: [SocialServiceController],
  providers: [SocialServiceService],
})
export class SimpleSocialServiceModule {}
