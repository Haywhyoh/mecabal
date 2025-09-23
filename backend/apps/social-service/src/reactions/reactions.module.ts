import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReactionsController } from './reactions.controller';
import { ReactionsService } from './reactions.service';
import { PostReaction, Post, User } from '@app/database';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PostReaction,
      Post,
      User,
    ]),
  ],
  controllers: [ReactionsController],
  providers: [ReactionsService],
  exports: [ReactionsService],
})
export class ReactionsModule {}
