import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ModerationController } from './moderation.controller';
import { ModerationService } from './moderation.service';
import { Post, PostComment, User } from '@mecabal/database';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Post,
      PostComment,
      User,
    ]),
  ],
  controllers: [ModerationController],
  providers: [ModerationService],
  exports: [ModerationService],
})
export class ModerationModule {}
