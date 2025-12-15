import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HelpOffersController } from './help-offers.controller';
import { HelpOffersService } from './help-offers.service';
import { HelpOffer } from '@app/database/entities/help-offer.entity';
import { Post } from '@app/database/entities/post.entity';
import { User } from '@app/database/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([HelpOffer, Post, User])],
  controllers: [HelpOffersController],
  providers: [HelpOffersService],
  exports: [HelpOffersService],
})
export class HelpOffersModule {}

