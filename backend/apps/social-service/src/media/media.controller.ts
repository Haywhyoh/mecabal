import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFiles,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '@mecabal/auth';
import { MediaService } from './media.service';
import {
  UploadMediaDto,
  MediaResponseDto,
  MediaUploadResponseDto,
  MediaFilterDto,
  PaginatedMediaDto,
} from './dto';

@ApiTags('Media')
@Controller('media')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload')
  @UseInterceptors(FilesInterceptor('files', 10)) // Allow up to 10 files
  @ApiOperation({ summary: 'Upload media files to DigitalOcean Spaces' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 201,
    description: 'Media uploaded successfully',
    type: MediaUploadResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid file or parameters' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async uploadMedia(
    @UploadedFiles() files: Express.Multer.File[],
    @Query() uploadDto: UploadMediaDto,
    @Request() req: any,
  ): Promise<MediaUploadResponseDto> {
    const userId = req.user.id;
    return this.mediaService.uploadMedia(files, uploadDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get media files with filtering and pagination' })
  @ApiResponse({
    status: 200,
    description: 'Media retrieved successfully',
    type: PaginatedMediaDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMedia(
    @Query() filterDto: MediaFilterDto,
    @Request() req: any,
  ): Promise<PaginatedMediaDto> {
    const userId = req.user.id;
    return this.mediaService.getMedia(filterDto, userId);
  }

  @Get('my-media')
  @ApiOperation({ summary: 'Get current user\'s media files' })
  @ApiResponse({
    status: 200,
    description: 'User media retrieved successfully',
    type: [MediaResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMyMedia(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Request() req: any,
  ): Promise<MediaResponseDto[]> {
    const userId = req.user.id;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    const offsetNum = offset ? parseInt(offset, 10) : 0;
    return this.mediaService.getUserMedia(userId, limitNum, offsetNum);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get current user\'s media statistics' })
  @ApiResponse({
    status: 200,
    description: 'Media statistics retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMediaStats(@Request() req: any) {
    const userId = req.user.id;
    return this.mediaService.getMediaStats(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single media file by ID' })
  @ApiParam({ name: 'id', description: 'Media ID' })
  @ApiResponse({
    status: 200,
    description: 'Media retrieved successfully',
    type: MediaResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Media not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMediaById(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<MediaResponseDto> {
    const userId = req.user.id;
    return this.mediaService.getMediaById(id, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a media file' })
  @ApiParam({ name: 'id', description: 'Media ID' })
  @ApiResponse({ status: 204, description: 'Media deleted successfully' })
  @ApiResponse({ status: 404, description: 'Media not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - can only delete own media' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deleteMedia(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<void> {
    const userId = req.user.id;
    return this.mediaService.deleteMedia(id, userId);
  }
}
