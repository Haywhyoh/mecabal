import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { PostComment } from '@app/database/entities/post-comment.entity';
import { Post } from '@app/database/entities/post.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PostComment, Post])],
  controllers: [CommentsController],
  providers: [CommentsService],
  exports: [CommentsService],
})
export class CommentsModule {}