import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { DigitalOceanSpacesService } from './digitalocean-spaces.service';
import { Media, User } from '@app/database';

@Module({
  imports: [TypeOrmModule.forFeature([Media, User]), ConfigModule],
  controllers: [MediaController],
  providers: [MediaService, DigitalOceanSpacesService],
  exports: [MediaService, DigitalOceanSpacesService],
})
export class MediaModule {}
