import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { PostComment, Post, User } from '@app/database';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PostComment,
      Post,
      User,
    ]),
  ],
  controllers: [CommentsController],
  providers: [CommentsService],
  exports: [CommentsService],
})
export class CommentsModule {}
