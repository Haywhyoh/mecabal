import {
  Controller,
  Get,
  Put,
  Delete,
  Post,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpStatus,
  HttpCode,
  Query,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard, CurrentUser } from '@app/auth';
import { User } from '@app/database';
import { FileUploadService } from '@app/storage';
import { UserProfileService } from '../services/user-profile.service';
import { UserSearchService } from '../services/user-search.service';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { UserResponseDto } from '../dto/user-response.dto';
import { UserSearchDto, UserSearchResponseDto } from '../dto/user-search.dto';

@ApiTags('User Profile')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserProfileController {
  constructor(
    private readonly userProfileService: UserProfileService,
    private readonly fileUploadService: FileUploadService,
    private readonly userSearchService: UserSearchService,
  ) {}

  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    type: UserResponseDto,
  })
  async getCurrentUserProfile(
    @CurrentUser() user: User,
  ): Promise<UserResponseDto> {
    return this.userProfileService.getUserById(user.id);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get user profile by ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async getUserProfile(
    @Param('id') userId: string,
  ): Promise<UserResponseDto> {
    return this.userProfileService.getUserById(userId);
  }

  @Get('by-email/:email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get user profile by email' })
  @ApiParam({ name: 'email', description: 'User email address' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async getUserByEmail(
    @Param('email') email: string,
  ): Promise<UserResponseDto> {
    return this.userProfileService.getUserByEmail(email);
  }

  @Get('by-phone/:phone')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get user profile by phone number' })
  @ApiParam({ name: 'phone', description: 'Phone number' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async getUserByPhone(
    @Param('phone') phone: string,
  ): Promise<UserResponseDto> {
    return this.userProfileService.getUserByPhone(phone);
  }

  @Put('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: 409,
    description: 'Email or phone number already in use',
  })
  async updateCurrentUserProfile(
    @CurrentUser() user: User,
    @Body() updateData: UpdateProfileDto,
  ): Promise<UserResponseDto> {
    return this.userProfileService.updateProfile(user.id, updateData);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update user profile by ID (Admin only)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async updateUserProfile(
    @Param('id') userId: string,
    @Body() updateData: UpdateProfileDto,
  ): Promise<UserResponseDto> {
    return this.userProfileService.updateProfile(userId, updateData);
  }

  @Get('me/completion')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get profile completion status' })
  @ApiResponse({
    status: 200,
    description: 'Profile completion percentage retrieved',
    schema: {
      type: 'object',
      properties: {
        percentage: { type: 'number' },
        missingFields: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  async getProfileCompletion(
    @CurrentUser() user: User,
  ): Promise<{ percentage: number; missingFields: string[] }> {
    return this.userProfileService.getProfileCompletion(user.id);
  }

  @Delete('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate current user account' })
  @ApiResponse({
    status: 200,
    description: 'Account deactivated successfully',
  })
  async deactivateAccount(
    @CurrentUser() user: User,
  ): Promise<{ message: string }> {
    return this.userProfileService.deactivateAccount(user.id);
  }

  @Get('search')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Search users with filters' })
  @ApiResponse({
    status: 200,
    description: 'Users retrieved successfully',
    type: UserSearchResponseDto,
  })
  async searchUsers(
    @Query() searchDto: UserSearchDto,
  ): Promise<UserSearchResponseDto> {
    return this.userSearchService.searchUsers(searchDto);
  }

  @Get('nearby')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get nearby users (same location)' })
  @ApiQuery({ name: 'state', required: true })
  @ApiQuery({ name: 'city', required: false })
  @ApiQuery({ name: 'estate', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({
    status: 200,
    description: 'Nearby users retrieved successfully',
    type: UserSearchResponseDto,
  })
  async getNearbyUsers(
    @Query('state') state: string,
    @Query('city') city?: string,
    @Query('estate') estate?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<UserSearchResponseDto> {
    return this.userSearchService.getUsersByLocation(
      state,
      city,
      estate,
      page,
      limit,
    );
  }

  @Get('verified')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get verified users' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({
    status: 200,
    description: 'Verified users retrieved successfully',
    type: UserSearchResponseDto,
  })
  async getVerifiedUsers(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<UserSearchResponseDto> {
    return this.userSearchService.getVerifiedUsers(page, limit);
  }

  @Post('me/avatar')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload user avatar' })
  @ApiBody({
    description: 'Avatar image file',
    schema: {
      type: 'object',
      properties: {
        avatar: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Avatar uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        avatarUrl: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid file or file too large',
  })
  async uploadAvatar(
    @CurrentUser() user: User,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ avatarUrl: string }> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validate file type
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Only image files are allowed');
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 5MB limit');
    }

    // Delete old avatar if exists
    if (user.profilePictureUrl) {
      try {
        // Extract key from URL for deletion
        const urlParts = user.profilePictureUrl.split('/');
        const key = urlParts[urlParts.length - 1];
        await this.fileUploadService.deleteFile(key);
      } catch (error) {
        // Log but don't fail if old avatar deletion fails
        console.error('Failed to delete old avatar:', error);
      }
    }

    // Prepare file data for upload
    const mediaFile = {
      buffer: file.buffer,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    };

    // Upload new avatar using shared service
    const uploadResult = await this.fileUploadService.uploadAvatar(
      mediaFile,
      user.id,
    );

    // Update user profile with new avatar URL
    await this.userProfileService.updateAvatar(user.id, uploadResult.url);

    return { avatarUrl: uploadResult.url };
  }

  @Delete('me/avatar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete user avatar' })
  @ApiResponse({
    status: 200,
    description: 'Avatar deleted successfully',
  })
  async deleteAvatar(
    @CurrentUser() user: User,
  ): Promise<{ message: string }> {
    if (!user.profilePictureUrl) {
      throw new BadRequestException('No avatar to delete');
    }

    try {
      // Extract key from URL for deletion
      const urlParts = user.profilePictureUrl.split('/');
      const key = urlParts[urlParts.length - 1];
      await this.fileUploadService.deleteFile(key);
    } catch (error) {
      console.error('Failed to delete avatar from storage:', error);
    }

    // Update user profile to remove avatar URL
    await this.userProfileService.updateAvatar(user.id, null);

    return { message: 'Avatar deleted successfully' };
  }
}