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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5432', 10),
      username: process.env.DATABASE_USERNAME || 'MeCabal_user',
      password: process.env.DATABASE_PASSWORD || 'MeCabal_password',
      database: process.env.DATABASE_NAME || 'MeCabal_dev',
      entities: [__dirname + '/../../libs/database/src/entities/*.entity{.ts,.js}'],
      synchronize: process.env.NODE_ENV === 'development',
      logging: process.env.NODE_ENV === 'development',
      ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
      } : false,
    }),
    PostsModule, 
    ReactionsModule, 
    CommentsModule, 
    ModerationModule, 
    CategoriesModule, 
    MediaModule
  ],
  controllers: [SocialServiceController],
  providers: [SocialServiceService],
})
export class SocialServiceModule {}
