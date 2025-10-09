import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DigitalOceanSpacesService } from './services/digitalocean-spaces.service';
import { FileUploadService } from './services/file-upload.service';
import { ImageProcessingService } from './services/image-processing.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    DigitalOceanSpacesService,
    FileUploadService,
    ImageProcessingService,
  ],
  exports: [
    DigitalOceanSpacesService,
    FileUploadService,
    ImageProcessingService,
  ],
})
export class StorageModule {}
