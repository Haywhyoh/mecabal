import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { User } from '@app/database';
import { FileUploadService } from '@app/storage';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { UserResponseDto } from '../dto/user-response.dto';
import { plainToClass } from 'class-transformer';

@Injectable()
export class UserProfileService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly fileUploadService: FileUploadService,
  ) {}

  /**
   * Get user profile by ID
   */
  async getUserById(userId: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['userNeighborhoods', 'userNeighborhoods.neighborhood'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return this.transformUserToResponse(user);
  }

  /**
   * Get user profile by email
   */
  async getUserByEmail(email: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['userNeighborhoods', 'userNeighborhoods.neighborhood'],
    });

    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }

    return this.transformUserToResponse(user);
  }

  /**
   * Get user profile by phone number
   */
  async getUserByPhone(phoneNumber: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({
      where: { phoneNumber },
      relations: ['userNeighborhoods', 'userNeighborhoods.neighborhood'],
    });

    if (!user) {
      throw new NotFoundException(`User with phone ${phoneNumber} not found`);
    }

    return this.transformUserToResponse(user);
  }

  /**
   * Update user profile
   */
  async updateProfile(
    userId: string,
    updateData: UpdateProfileDto,
  ): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Check for email uniqueness if email is being updated
    if (updateData.email && updateData.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: updateData.email, id: Not(userId) },
      });

      if (existingUser) {
        throw new ConflictException('Email already in use by another user');
      }
    }

    // Check for phone uniqueness if phone is being updated
    if (updateData.phoneNumber && updateData.phoneNumber !== user.phoneNumber) {
      const existingUser = await this.userRepository.findOne({
        where: { phoneNumber: updateData.phoneNumber, id: Not(userId) },
      });

      if (existingUser) {
        throw new ConflictException('Phone number already in use by another user');
      }
    }

    // Update user fields
    Object.assign(user, updateData);

    // Save updated user
    const updatedUser = await this.userRepository.save(user);

    // Return response
    return this.transformUserToResponse(updatedUser);
  }

  /**
   * Update user avatar/profile picture
   */
  async updateAvatar(
    userId: string,
    avatarUrl: string | null,
  ): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    user.profilePictureUrl = avatarUrl || undefined;
    const updatedUser = await this.userRepository.save(user);

    return this.transformUserToResponse(updatedUser);
  }

  /**
   * Delete/deactivate user account
   */
  async deactivateAccount(userId: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Soft delete - set isActive to false
    user.isActive = false;
    await this.userRepository.save(user);

    return {
      message: 'Account deactivated successfully',
    };
  }

  /**
   * Reactivate user account
   */
  async reactivateAccount(userId: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    user.isActive = true;
    await this.userRepository.save(user);

    return {
      message: 'Account reactivated successfully',
    };
  }

  /**
   * Get user profile completion percentage
   */
  async getProfileCompletion(userId: string): Promise<{
    percentage: number;
    missingFields: string[];
  }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['primaryLocation', 'primaryLocation.state', 'primaryLocation.neighborhood'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const requiredFields = {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      phoneVerified: user.phoneVerified,
      bio: user.bio,
      occupation: user.occupation,
      state: user.primaryLocation?.state?.name,
      city: user.primaryLocation?.cityTown,
      profilePictureUrl: user.profilePictureUrl,
    };

    const missingFields: string[] = [];
    let completedFields = 0;
    const totalFields = Object.keys(requiredFields).length;

    Object.entries(requiredFields).forEach(([key, value]) => {
      if (value) {
        completedFields++;
      } else {
        missingFields.push(key);
      }
    });

    const percentage = Math.round((completedFields / totalFields) * 100);

    return {
      percentage,
      missingFields,
    };
  }

  /**
   * Transform User entity to UserResponseDto
   */
  private transformUserToResponse(user: User): UserResponseDto {
    const response = plainToClass(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });

    // Add verification level
    response.verificationLevel = user.getVerificationLevel();

    return response;
  }
}