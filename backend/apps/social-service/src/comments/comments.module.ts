import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { PostComment } from '@app/database/entities/post-comment.entity';
import { CommentMedia } from '@app/database/entities/comment-media.entity';
import { Post } from '@app/database/entities/post.entity';
import { User } from '@app/database/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PostComment, CommentMedia, Post, User])],
  controllers: [CommentsController],
  providers: [CommentsService],
  exports: [CommentsService],
})
export class CommentsModule {}
