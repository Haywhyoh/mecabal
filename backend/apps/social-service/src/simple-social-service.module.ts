import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '@app/database';
import { SocialServiceController } from './social-service.controller';
import { SocialServiceService } from './social-service.service';
import { PostsModule } from './posts/posts.module';

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
export class SimpleSocialServiceModule {}
