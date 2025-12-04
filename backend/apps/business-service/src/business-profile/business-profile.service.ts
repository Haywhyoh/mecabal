import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessProfile } from '@app/database/entities/business-profile.entity';
import { CreateBusinessProfileDto } from '../dto/create-business-profile.dto';
import { UpdateBusinessProfileDto } from '../dto/update-business-profile.dto';
import { FileUploadService } from '@app/storage';
import { MediaFile } from '@app/storage/interfaces/upload.interface';

@Injectable()
export class BusinessProfileService {
  constructor(
    @InjectRepository(BusinessProfile)
    private businessProfileRepo: Repository<BusinessProfile>,
    private readonly fileUploadService: FileUploadService,
  ) {}

  async create(
    userId: string,
    createDto: CreateBusinessProfileDto,
  ): Promise<BusinessProfile> {
    // Check if user already has a business profile
    const existingBusiness = await this.businessProfileRepo.findOne({
      where: { userId },
    });

    if (existingBusiness) {
      throw new BadRequestException(
        'User already has a business profile. Use update endpoint instead.',
      );
    }

    const business = this.businessProfileRepo.create({
      userId,
      ...createDto,
      isActive: true,
      isVerified: false,
      verificationLevel: 'basic',
      rating: 0,
      reviewCount: 0,
      completedJobs: 0,
    });

    return await this.businessProfileRepo.save(business);
  }

  async findById(id: string): Promise<BusinessProfile> {
    const business = await this.businessProfileRepo.findOne({
      where: { id },
      relations: ['user', 'licenses', 'services', 'reviews'],
    });

    if (!business) {
      throw new NotFoundException('Business profile not found');
    }

    return business;
  }

  async findByUserId(userId: string): Promise<BusinessProfile | null> {
    return await this.businessProfileRepo.findOne({
      where: { userId },
      relations: ['licenses', 'services'],
    });
  }

  async update(
    id: string,
    userId: string,
    updateDto: UpdateBusinessProfileDto,
  ): Promise<BusinessProfile> {
    const business = await this.findById(id);

    // Ensure user owns this business
    if (business.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to update this business',
      );
    }

    Object.assign(business, updateDto);
    return await this.businessProfileRepo.save(business);
  }

  async updateStatus(
    id: string,
    userId: string,
    isActive: boolean,
  ): Promise<BusinessProfile> {
    const business = await this.findById(id);

    if (business.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to update this business',
      );
    }

    business.isActive = isActive;
    return await this.businessProfileRepo.save(business);
  }

  async delete(id: string, userId: string): Promise<void> {
    const business = await this.findById(id);

    if (business.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to delete this business',
      );
    }

    await this.businessProfileRepo.remove(business);
  }

  async incrementCompletedJobs(id: string): Promise<void> {
    await this.businessProfileRepo.increment({ id }, 'completedJobs', 1);
  }

  async updateProfileImage(id: string, userId: string, imageUrl: string): Promise<BusinessProfile> {
    const business = await this.findById(id);

    if (business.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to update this business',
      );
    }

    business.profileImageUrl = imageUrl;
    return await this.businessProfileRepo.save(business);
  }

  async updateCoverImage(id: string, userId: string, imageUrl: string): Promise<BusinessProfile> {
    const business = await this.findById(id);

    if (business.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to update this business',
      );
    }

    business.coverImageUrl = imageUrl;
    return await this.businessProfileRepo.save(business);
  }
}
