import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request as ExpressRequest } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { FileUploadService } from '@app/storage';

interface AuthenticatedRequest extends ExpressRequest {
  user: {
    id: string;
    email: string;
  };
}
import { BusinessProfileService } from './business-profile.service';
import { CreateBusinessProfileDto } from '../dto/create-business-profile.dto';
import { UpdateBusinessProfileDto } from '../dto/update-business-profile.dto';
import { JwtAuthGuard } from '@app/auth/guards/jwt-auth.guard';

@ApiTags('Business Profile')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BusinessProfileController {
  constructor(
    private readonly businessProfileService: BusinessProfileService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new business profile' })
  @ApiResponse({ status: 201, description: 'Business profile created successfully' })
  @ApiResponse({ status: 400, description: 'User already has a business profile' })
  async register(
    @Request() req: AuthenticatedRequest,
    @Body() createDto: CreateBusinessProfileDto,
  ) {
      const business = await this.businessProfileService.create(
        req.user.id,
        createDto,
      );
    return {
      success: true,
      message: 'Business profile created successfully',
      data: business,
    };
  }

  @Get('my-business')
  @ApiOperation({ summary: 'Get current user\'s business profile' })
  @ApiResponse({ status: 200, description: 'Business profile retrieved' })
  @ApiResponse({ status: 404, description: 'No business profile found' })
  async getMyBusiness(@Request() req: AuthenticatedRequest) {
    const business = await this.businessProfileService.findByUserId(
      req.user.id,
    );
    
    // Return 404 if no business found (matches mobile app behavior)
    if (!business) {
      throw new NotFoundException('No business profile found for this user');
    }
    
    return {
      success: true,
      data: business,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get business profile by ID' })
  @ApiResponse({ status: 200, description: 'Business profile retrieved' })
  @ApiResponse({ status: 404, description: 'Business not found' })
  async getById(@Param('id') id: string) {
    // Validate that id is a UUID to prevent matching routes like /categories
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw new NotFoundException('Invalid business ID format');
    }
    
    const business = await this.businessProfileService.findById(id);
    return {
      success: true,
      data: business,
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update business profile' })
  @ApiResponse({ status: 200, description: 'Business profile updated' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Business not found' })
  async update(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
    @Body() updateDto: UpdateBusinessProfileDto,
  ) {
    // Validate that id is a UUID to prevent matching routes like /categories
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw new NotFoundException('Invalid business ID format');
    }
    
    const business = await this.businessProfileService.update(
      id,
      req.user.id,
      updateDto,
    );
    return {
      success: true,
      message: 'Business profile updated successfully',
      data: business,
    };
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update business online/offline status' })
  @ApiResponse({ status: 200, description: 'Status updated successfully' })
  async updateStatus(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
    @Body('isActive') isActive: boolean,
  ) {
    // Validate that id is a UUID to prevent matching routes like /categories
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw new NotFoundException('Invalid business ID format');
    }
    
    const business = await this.businessProfileService.updateStatus(
      id,
      req.user.id,
      isActive,
    );
    return {
      success: true,
      message: `Business is now ${isActive ? 'online' : 'offline'}`,
      data: business,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete business profile' })
  @ApiResponse({ status: 204, description: 'Business profile deleted' })
  async delete(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    // Validate that id is a UUID to prevent matching routes like /categories
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw new NotFoundException('Invalid business ID format');
    }
    
    await this.businessProfileService.delete(id, req.user.id);
  }

  @Post(':id/profile-image')
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload business profile image' })
  @ApiResponse({ status: 200, description: 'Profile image uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file or file too large' })
  @ApiResponse({ status: 404, description: 'Business not found' })
  async uploadProfileImage(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
    @UploadedFile() file: Express.Multer.File,
  ) {
    // Validate that id is a UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw new NotFoundException('Invalid business ID format');
    }

    if (!file) {
      throw new BadRequestException('No image file provided');
    }

    const business = await this.businessProfileService.findById(id);

    if (business.userId !== req.user.id) {
      throw new ForbiddenException(
        'You do not have permission to update this business',
      );
    }

    // Prepare file for upload
    const mediaFile = {
      buffer: file.buffer,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    };

    // Upload image (process as avatar-like image, 400x400)
    const uploadResult = await this.fileUploadService.uploadAvatar(
      mediaFile,
      req.user.id,
    );

    // Update business profile with new image URL
    const updatedBusiness = await this.businessProfileService.updateProfileImage(
      id,
      req.user.id,
      uploadResult.url,
    );

    return {
      success: true,
      message: 'Profile image uploaded successfully',
      profileImageUrl: uploadResult.url,
      data: updatedBusiness,
    };
  }

  @Post(':id/cover-image')
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload business cover image' })
  @ApiResponse({ status: 200, description: 'Cover image uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file or file too large' })
  @ApiResponse({ status: 404, description: 'Business not found' })
  async uploadCoverImage(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
    @UploadedFile() file: Express.Multer.File,
  ) {
    // Validate that id is a UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw new NotFoundException('Invalid business ID format');
    }

    if (!file) {
      throw new BadRequestException('No image file provided');
    }

    const business = await this.businessProfileService.findById(id);

    if (business.userId !== req.user.id) {
      throw new ForbiddenException(
        'You do not have permission to update this business',
      );
    }

    // Prepare file for upload
    const mediaFile = {
      buffer: file.buffer,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    };

    // Upload cover image (process as larger image, 1200x400 recommended)
    const uploadResult = await this.fileUploadService.uploadMedia(
      mediaFile,
      req.user.id,
      { maxWidth: 1200, quality: 85 },
    );

    // Update business profile with new cover image URL
    const updatedBusiness = await this.businessProfileService.updateCoverImage(
      id,
      req.user.id,
      uploadResult.url,
    );

    return {
      success: true,
      message: 'Cover image uploaded successfully',
      coverImageUrl: uploadResult.url,
      data: updatedBusiness,
    };
  }
}
