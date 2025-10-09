import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessLicense } from '@app/database/entities/business-license.entity';
import { BusinessProfile } from '@app/database/entities/business-profile.entity';
import {
  CreateBusinessLicenseDto,
  UpdateBusinessLicenseDto,
  VerifyLicenseDto,
} from '../dto/license.dto';

@Injectable()
export class BusinessLicenseService {
  constructor(
    @InjectRepository(BusinessLicense)
    private licenseRepo: Repository<BusinessLicense>,
    @InjectRepository(BusinessProfile)
    private businessRepo: Repository<BusinessProfile>,
  ) {}

  async create(
    businessId: string,
    userId: string,
    createDto: CreateBusinessLicenseDto,
  ): Promise<BusinessLicense> {
    // Verify business exists and user owns it
    const business = await this.businessRepo.findOne({
      where: { id: businessId },
    });

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    if (business.userId !== userId) {
      throw new ForbiddenException('You do not own this business');
    }

    const license = this.licenseRepo.create({
      businessId,
      ...createDto,
    });

    const savedLicense = await this.licenseRepo.save(license);

    // Update verification level based on licenses
    await this.updateVerificationLevel(businessId);

    return savedLicense;
  }

  async findByBusiness(businessId: string): Promise<BusinessLicense[]> {
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
      throw new NotFoundException('License not found');
    }

    return license;
  }

  async update(
    id: string,
    userId: string,
    updateDto: UpdateBusinessLicenseDto,
  ): Promise<BusinessLicense> {
    const license = await this.findById(id);

    if (license.business.userId !== userId) {
      throw new ForbiddenException('You do not own this business');
    }

    Object.assign(license, updateDto);
    return await this.licenseRepo.save(license);
  }

  async delete(id: string, userId: string): Promise<void> {
    const license = await this.findById(id);

    if (license.business.userId !== userId) {
      throw new ForbiddenException('You do not own this business');
    }

    const businessId = license.businessId;
    await this.licenseRepo.remove(license);

    // Update verification level after removing license
    await this.updateVerificationLevel(businessId);
  }

  async verifyLicense(
    id: string,
    verifyDto: VerifyLicenseDto,
  ): Promise<BusinessLicense> {
    // This endpoint should be protected and only accessible by admins
    const license = await this.findById(id);

    license.isVerified = verifyDto.isVerified;
    const updatedLicense = await this.licenseRepo.save(license);

    // Update business verification level
    await this.updateVerificationLevel(license.businessId);

    return updatedLicense;
  }

  private async updateVerificationLevel(businessId: string): Promise<void> {
    const business = await this.businessRepo.findOne({
      where: { id: businessId },
      relations: ['licenses'],
    });

    if (!business) return;

    const verifiedLicenses = business.licenses.filter((l) => l.isVerified);
    const licenseCount = verifiedLicenses.length;

    let verificationLevel = 'basic';
    let isVerified = false;

    if (licenseCount === 0) {
      verificationLevel = 'basic';
      isVerified = false;
    } else if (licenseCount >= 1 && licenseCount < 3) {
      verificationLevel = 'enhanced';
      isVerified = true;
    } else if (licenseCount >= 3) {
      verificationLevel = 'premium';
      isVerified = true;
    }

    await this.businessRepo.update(businessId, {
      verificationLevel,
      isVerified,
    });
  }
}
