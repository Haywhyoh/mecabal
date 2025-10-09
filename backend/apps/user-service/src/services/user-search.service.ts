import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, ILike } from 'typeorm';
import { User } from '@app/database';
import { UserSearchDto, UserSearchResponseDto } from '../dto/user-search.dto';
import { UserResponseDto } from '../dto/user-response.dto';
import { plainToClass } from 'class-transformer';

@Injectable()
export class UserSearchService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Search users with filters and pagination
   */
  async searchUsers(
    searchDto: UserSearchDto,
  ): Promise<UserSearchResponseDto> {
    const {
      query,
      state,
      city,
      estate,
      culturalBackground,
      occupation,
      verificationLevel,
      verifiedOnly,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = searchDto;

    // Build query
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .where('user.isActive = :isActive', { isActive: true });

    // Text search (name, email, occupation)
    if (query) {
      queryBuilder.andWhere(
        '(user.firstName ILIKE :query OR user.lastName ILIKE :query OR user.email ILIKE :query OR user.occupation ILIKE :query)',
        { query: `%${query}%` },
      );
    }

    // Location filters
    if (state) {
      queryBuilder.andWhere('user.state = :state', { state });
    }

    if (city) {
      queryBuilder.andWhere('user.city = :city', { city });
    }

    if (estate) {
      queryBuilder.andWhere('user.estate ILIKE :estate', {
        estate: `%${estate}%`,
      });
    }

    // Cultural filter
    if (culturalBackground) {
      queryBuilder.andWhere(
        'user.culturalBackground = :culturalBackground',
        { culturalBackground },
      );
    }

    // Occupation filter
    if (occupation) {
      queryBuilder.andWhere('user.occupation ILIKE :occupation', {
        occupation: `%${occupation}%`,
      });
    }

    // Verification filters
    if (verifiedOnly) {
      queryBuilder.andWhere('user.isVerified = :verified', {
        verified: true,
      });
    }

    if (verificationLevel) {
      switch (verificationLevel) {
        case 'phone':
          queryBuilder.andWhere('user.phoneVerified = :phoneVerified', {
            phoneVerified: true,
          });
          break;
        case 'identity':
          queryBuilder.andWhere(
            'user.phoneVerified = :phoneVerified AND user.identityVerified = :identityVerified',
            { phoneVerified: true, identityVerified: true },
          );
          break;
        case 'full':
          queryBuilder.andWhere(
            'user.phoneVerified = :phoneVerified AND user.identityVerified = :identityVerified AND user.addressVerified = :addressVerified',
            {
              phoneVerified: true,
              identityVerified: true,
              addressVerified: true,
            },
          );
          break;
        case 'unverified':
          queryBuilder.andWhere('user.isVerified = :verified', {
            verified: false,
          });
          break;
      }
    }

    // Sorting
    const sortField = `user.${sortBy}`;
    queryBuilder.orderBy(sortField, sortOrder);

    // Pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // Execute query
    const [users, total] = await queryBuilder.getManyAndCount();

    // Transform to response DTOs
    const userDtos = users.map(user =>
      plainToClass(UserResponseDto, user, {
        excludeExtraneousValues: true,
      }),
    );

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return {
      users: userDtos,
      total,
      page,
      limit,
      totalPages,
      hasNextPage,
      hasPreviousPage,
    };
  }

  /**
   * Get users by location (nearby neighbors)
   */
  async getUsersByLocation(
    state: string,
    city?: string,
    estate?: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<UserSearchResponseDto> {
    return this.searchUsers({
      state,
      city,
      estate,
      page,
      limit,
      verifiedOnly: true,
    });
  }

  /**
   * Get users by cultural background
   */
  async getUsersByCulture(
    culturalBackground: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<UserSearchResponseDto> {
    return this.searchUsers({
      culturalBackground,
      page,
      limit,
    });
  }

  /**
   * Get verified users
   */
  async getVerifiedUsers(
    page: number = 1,
    limit: number = 20,
  ): Promise<UserSearchResponseDto> {
    return this.searchUsers({
      verifiedOnly: true,
      page,
      limit,
      sortBy: 'trustScore',
      sortOrder: 'DESC',
    });
  }
}
