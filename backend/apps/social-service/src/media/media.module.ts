import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { StorageModule } from '@app/storage';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { Media, User } from '@app/database';

@Module({
  imports: [
    TypeOrmModule.forFeature([Media, User]), 
    ConfigModule,
    StorageModule, // For FileUploadService
  ],
  controllers: [MediaController],
  providers: [MediaService],
  exports: [MediaService],
})
export class MediaModule {}
