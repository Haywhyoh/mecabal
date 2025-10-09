import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessLicense } from '@app/database/entities/business-license.entity';
import { BusinessProfile } from '@app/database/entities/business-profile.entity';
import { CreateBusinessLicenseDto } from '../dto/create-business-license.dto';
import { UpdateBusinessLicenseDto } from '../dto/update-business-license.dto';

@Injectable()
export class BusinessLicensesService {
  constructor(
    @InjectRepository(BusinessLicense)
    private licenseRepo: Repository<BusinessLicense>,
    @InjectRepository(BusinessProfile)
    private businessProfileRepo: Repository<BusinessProfile>,
  ) {}

  async create(
    businessId: string,
    userId: string,
    createDto: CreateBusinessLicenseDto,
  ): Promise<BusinessLicense> {
    // Verify business ownership
    const business = await this.businessProfileRepo.findOne({
      where: { id: businessId, userId },
    });

    if (!business) {
      throw new ForbiddenException(
        'You do not have permission to add licenses to this business',
      );
    }

    const license = this.licenseRepo.create({
      businessId,
      ...createDto,
      isVerified: createDto.isVerified ?? false,
    });

    return await this.licenseRepo.save(license);
  }

  async findByBusinessId(businessId: string): Promise<BusinessLicense[]> {
    return await this.licenseRepo.find({
      where: { businessId },
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<BusinessLicense> {
    const license = await this.licenseRepo.findOne({
      where: { id },
      relations: ['business'],
    });

    if (!license) {
      throw new NotFoundException('Business license not found');
    }

    return license;
  }

  async update(
    id: string,
    userId: string,
    updateDto: UpdateBusinessLicenseDto,
  ): Promise<BusinessLicense> {
    const license = await this.findById(id);

    // Verify business ownership
    const business = await this.businessProfileRepo.findOne({
      where: { id: license.businessId, userId },
    });

    if (!business) {
      throw new ForbiddenException(
        'You do not have permission to update this license',
      );
    }

    Object.assign(license, updateDto);
    return await this.licenseRepo.save(license);
  }

  async delete(id: string, userId: string): Promise<void> {
    const license = await this.findById(id);

    // Verify business ownership
    const business = await this.businessProfileRepo.findOne({
      where: { id: license.businessId, userId },
    });

    if (!business) {
      throw new ForbiddenException(
        'You do not have permission to delete this license',
      );
    }

    await this.licenseRepo.remove(license);
  }

  async verifyLicense(id: string, isVerified: boolean): Promise<BusinessLicense> {
    const license = await this.findById(id);
    license.isVerified = isVerified;
    return await this.licenseRepo.save(license);
  }
}
