import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { SocialServiceController } from './social-service.controller';
import { SocialServiceService } from './social-service.service';
import { PostsModule } from './posts/posts.module';
import { ReactionsModule } from './reactions/reactions.module';
import { CommentsModule } from './comments/comments.module';
import { ModerationModule } from './moderation/moderation.module';
import { CategoriesModule } from './categories/categories.module';
import { MediaModule } from './media/media.module';
import { DatabaseModule } from '@app/database';
import { AuthModule } from '@app/auth';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    AuthModule,
    PostsModule,
    ReactionsModule,
    CommentsModule,
    ModerationModule,
    CategoriesModule,
    MediaModule,
  ],
  controllers: [SocialServiceController],
  providers: [SocialServiceService],
})
export class SocialServiceModule {}
