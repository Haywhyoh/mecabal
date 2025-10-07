import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReactionsController } from './reactions.controller';
import { ReactionsService } from './reactions.service';
import { PostReaction } from '@app/database/entities/post-reaction.entity';
import { Post } from '@app/database/entities/post.entity';
import { User } from '@app/database/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PostReaction, Post, User])],
  controllers: [ReactionsController],
  providers: [ReactionsService],
  exports: [ReactionsService],
})
export class ReactionsModule {}
