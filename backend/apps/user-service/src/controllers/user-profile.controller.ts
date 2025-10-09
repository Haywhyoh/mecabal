import {
  Controller,
  Get,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpStatus,
  HttpCode,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard, CurrentUser } from '@app/auth';
import { User } from '@app/database';
import { UserProfileService } from '../services/user-profile.service';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { UserResponseDto } from '../dto/user-response.dto';

@ApiTags('User Profile')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserProfileController {
  constructor(
    private readonly userProfileService: UserProfileService,
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
}