import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { CategoriesModule } from '../categories/categories.module';
import {
  Post,
  PostCategory,
  PostMedia,
  PostReaction,
  PostComment,
  User,
} from '@app/database';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Post,
      PostCategory,
      PostMedia,
      PostReaction,
      PostComment,
      User,
    ]),
    CategoriesModule,
  ],
  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule {}
