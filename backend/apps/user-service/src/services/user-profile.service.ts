import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { User, UserNeighborhood } from '@app/database';
import { FileUploadService } from '@app/storage';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { UserResponseDto, UserEstateDto } from '../dto/user-response.dto';
import { plainToClass } from 'class-transformer';

@Injectable()
export class UserProfileService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserNeighborhood)
    private readonly userNeighborhoodRepository: Repository<UserNeighborhood>,
    private readonly fileUploadService: FileUploadService,
  ) {}

  /**
   * Get user profile by ID
   */
  async getUserById(userId: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: [
        'userNeighborhoods',
        'userNeighborhoods.neighborhood',
        'userNeighborhoods.neighborhood.lga',
        'userNeighborhoods.neighborhood.lga.state',
        'userNeighborhoods.neighborhood.ward',
      ],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return await this.transformUserToResponse(user);
  }

  /**
   * Get user profile by email
   */
  async getUserByEmail(email: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({
      where: { email },
      relations: [
        'userNeighborhoods',
        'userNeighborhoods.neighborhood',
        'userNeighborhoods.neighborhood.lga',
        'userNeighborhoods.neighborhood.lga.state',
        'userNeighborhoods.neighborhood.ward',
      ],
    });

    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }

    return await this.transformUserToResponse(user);
  }

  /**
   * Get user profile by phone number
   */
  async getUserByPhone(phoneNumber: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({
      where: { phoneNumber },
      relations: [
        'userNeighborhoods',
        'userNeighborhoods.neighborhood',
        'userNeighborhoods.neighborhood.lga',
        'userNeighborhoods.neighborhood.lga.state',
        'userNeighborhoods.neighborhood.ward',
      ],
    });

    if (!user) {
      throw new NotFoundException(`User with phone ${phoneNumber} not found`);
    }

    return await this.transformUserToResponse(user);
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
    const updatedUser = await this.userRepository.findOne({
      where: { id: userId },
      relations: [
        'userNeighborhoods',
        'userNeighborhoods.neighborhood',
        'userNeighborhoods.neighborhood.lga',
        'userNeighborhoods.neighborhood.lga.state',
        'userNeighborhoods.neighborhood.ward',
      ],
    });

    if (!updatedUser) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Return response
    return await this.transformUserToResponse(updatedUser);
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
    await this.userRepository.save(user);

    const updatedUser = await this.userRepository.findOne({
      where: { id: userId },
      relations: [
        'userNeighborhoods',
        'userNeighborhoods.neighborhood',
        'userNeighborhoods.neighborhood.lga',
        'userNeighborhoods.neighborhood.lga.state',
        'userNeighborhoods.neighborhood.ward',
      ],
    });

    if (!updatedUser) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return await this.transformUserToResponse(updatedUser);
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
   * Get user estates/neighborhoods
   */
  async getUserEstates(userId: string): Promise<UserEstateDto[]> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: [
        'userNeighborhoods',
        'userNeighborhoods.neighborhood',
        'userNeighborhoods.neighborhood.lga',
        'userNeighborhoods.neighborhood.lga.state',
        'userNeighborhoods.neighborhood.ward',
      ],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (!user.userNeighborhoods || user.userNeighborhoods.length === 0) {
      return [];
    }

    // Transform userNeighborhoods to UserEstateDto array
    const estates = await Promise.all(
      user.userNeighborhoods.map(async (userNeighborhood) => {
        const neighborhood = userNeighborhood.neighborhood;
        if (!neighborhood) return null;

        // Get member count for this neighborhood
        const memberCount = await this.userNeighborhoodRepository.count({
          where: { neighborhoodId: neighborhood.id },
        });

        // Build location string
        const locationParts = [
          neighborhood.name,
          neighborhood.ward?.name,
          neighborhood.lga?.name,
          neighborhood.lga?.state?.name,
        ].filter(Boolean);
        const location = locationParts.join(', ');

        return {
          id: neighborhood.id,
          name: neighborhood.name,
          type: neighborhood.type,
          location,
          state: neighborhood.lga?.state?.name,
          lga: neighborhood.lga?.name,
          city: neighborhood.ward?.name || neighborhood.lga?.name,
          isPrimary: userNeighborhood.isPrimary,
          isVerified: neighborhood.isVerified || false,
          joinedAt: userNeighborhood.joinedAt,
          relationshipType: userNeighborhood.relationshipType,
          verificationMethod: userNeighborhood.verificationMethod,
          memberCount,
        } as UserEstateDto;
      })
    );

    // Filter out null values and return
    return estates.filter(
      (estate): estate is UserEstateDto => estate !== null,
    );
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
  private async transformUserToResponse(user: User): Promise<UserResponseDto> {
    const response = plainToClass(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });

    // Initialize userNeighborhoods to ensure it's always defined
    response.userNeighborhoods = [];

    // Add verification level
    response.verificationLevel = user.getVerificationLevel();

    // Get primary neighborhood
    const primaryNeighborhood = user.primaryNeighborhood;

    // Populate estate/state/city from primaryNeighborhood if available
    if (primaryNeighborhood) {
      response.estate = primaryNeighborhood.name;
      response.state = primaryNeighborhood.lga?.state?.name;
      response.city = primaryNeighborhood.ward?.name || primaryNeighborhood.lga?.name;
    }

    // Transform userNeighborhoods to UserEstateDto array
    if (user.userNeighborhoods && user.userNeighborhoods.length > 0) {
      const estates = await Promise.all(
        user.userNeighborhoods.map(async (userNeighborhood) => {
          const neighborhood = userNeighborhood.neighborhood;
          if (!neighborhood) return null;

          // Get member count for this neighborhood
          const memberCount = await this.userNeighborhoodRepository.count({
            where: { neighborhoodId: neighborhood.id },
          });

          // Build location string
          const locationParts = [
            neighborhood.name,
            neighborhood.ward?.name,
            neighborhood.lga?.name,
            neighborhood.lga?.state?.name,
          ].filter(Boolean);
          const location = locationParts.join(', ');

          return {
            id: neighborhood.id,
            name: neighborhood.name,
            type: neighborhood.type,
            location,
            state: neighborhood.lga?.state?.name,
            lga: neighborhood.lga?.name,
            city: neighborhood.ward?.name || neighborhood.lga?.name,
            isPrimary: userNeighborhood.isPrimary,
            isVerified: neighborhood.isVerified || false,
            joinedAt: userNeighborhood.joinedAt,
            relationshipType: userNeighborhood.relationshipType,
            verificationMethod: userNeighborhood.verificationMethod,
            memberCount,
          } as UserEstateDto;
        })
      );
      // Filter out null values and assign
      response.userNeighborhoods = estates.filter(
        (estate): estate is UserEstateDto => estate !== null,
      );
    }

    return response;
  }
}