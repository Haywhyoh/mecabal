import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Listing, ListingCategory, User, BusinessProfile } from '@app/database';

@Injectable()
export class DataIntegrityService {
  constructor(
    @InjectRepository(Listing)
    private readonly listingRepository: Repository<Listing>,
    @InjectRepository(ListingCategory)
    private readonly categoryRepository: Repository<ListingCategory>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(BusinessProfile)
    private readonly businessRepository: Repository<BusinessProfile>,
  ) {}

  /**
   * Validate data integrity for listing creation
   */
  async validateListingIntegrity(listingData: any): Promise<void> {
    console.log('🔍 DataIntegrityService - Starting validation with data:', {
      userId: listingData.userId,
      categoryId: listingData.categoryId,
      neighborhoodId: listingData.neighborhoodId,
      listingType: listingData.listingType,
      propertyType: listingData.propertyType
    });

    // Validate foreign key relationships
    await this.validateForeignKeyIntegrity(listingData);

    // Validate data consistency
    this.validateDataConsistency(listingData);

    // Validate business logic constraints
    this.validateBusinessConstraints(listingData);
    
    console.log('✅ DataIntegrityService - All validations passed');
  }

  /**
   * Validate foreign key relationships
   */
  private async validateForeignKeyIntegrity(listingData: any): Promise<void> {
    // Validate user exists
    if (listingData.userId) {
      const user = await this.userRepository.findOne({
        where: { id: listingData.userId },
      });
      if (!user) {
        throw new BadRequestException('User not found');
      }
    }

    // Validate category exists
    if (listingData.categoryId) {
      const category = await this.categoryRepository.findOne({
        where: { id: listingData.categoryId },
      });
      if (!category) {
        throw new BadRequestException('Category not found');
      }
    }

    // Validate neighborhood exists (if provided)
    if (listingData.neighborhoodId) {
      // This would need to be implemented based on your neighborhood entity
      // const neighborhood = await this.neighborhoodRepository.findOne({
      //   where: { id: listingData.neighborhoodId },
      // });
      // if (!neighborhood) {
      //   throw new BadRequestException('Neighborhood not found');
      // }
    }
  }

  /**
   * Validate data consistency
   */
  private validateDataConsistency(listingData: any): void {
    // Validate salary range consistency
    if (listingData.salaryMin && listingData.salaryMax) {
      if (listingData.salaryMin > listingData.salaryMax) {
        throw new BadRequestException('Minimum salary cannot be greater than maximum salary');
      }
    }

    // Validate property size consistency
    if (listingData.propertySize && listingData.landSize) {
      if (listingData.propertySize > listingData.landSize) {
        throw new BadRequestException('Property size cannot be larger than land size');
      }
    }

    // Validate bedroom/bathroom consistency
    if (listingData.bedrooms && listingData.bathrooms) {
      if (listingData.bedrooms < listingData.bathrooms) {
        throw new BadRequestException('Number of bedrooms cannot be less than number of bathrooms');
      }
    }

    // Validate date consistency
    if (listingData.applicationDeadline) {
      const deadline = new Date(listingData.applicationDeadline);
      const now = new Date();
      if (deadline <= now) {
        throw new BadRequestException('Application deadline must be in the future');
      }
    }

    // Validate JSON field consistency
    this.validateJsonFields(listingData);
  }

  /**
   * Validate JSON fields
   */
  private validateJsonFields(listingData: any): void {
    // Validate required skills array
    if (listingData.requiredSkills) {
      if (!Array.isArray(listingData.requiredSkills)) {
        throw new BadRequestException('Required skills must be an array');
      }
      if (listingData.requiredSkills.length === 0) {
        throw new BadRequestException('At least one skill is required');
      }
    }

    // Validate property amenities array
    if (listingData.propertyAmenities) {
      if (!Array.isArray(listingData.propertyAmenities)) {
        throw new BadRequestException('Property amenities must be an array');
      }
    }

    // Validate security features array
    if (listingData.securityFeatures) {
      if (!Array.isArray(listingData.securityFeatures)) {
        throw new BadRequestException('Security features must be an array');
      }
    }

    // Validate utilities included array
    if (listingData.utilitiesIncluded) {
      if (!Array.isArray(listingData.utilitiesIncluded)) {
        throw new BadRequestException('Utilities included must be an array');
      }
    }

    // Validate availability schedule object
    if (listingData.availabilitySchedule) {
      this.validateAvailabilityScheduleStructure(listingData.availabilitySchedule);
    }

    // Validate professional credentials object
    if (listingData.professionalCredentials) {
      this.validateProfessionalCredentialsStructure(listingData.professionalCredentials);
    }

    // Validate company info object
    if (listingData.companyInfo) {
      this.validateCompanyInfoStructure(listingData.companyInfo);
    }

    // Validate contact preferences object
    if (listingData.contactPreferences) {
      this.validateContactPreferencesStructure(listingData.contactPreferences);
    }
  }

  /**
   * Validate availability schedule structure
   */
  private validateAvailabilityScheduleStructure(schedule: any): void {
    if (typeof schedule !== 'object' || schedule === null) {
      throw new BadRequestException('Availability schedule must be an object');
    }

    if (!schedule.days || !Array.isArray(schedule.days)) {
      throw new BadRequestException('Availability schedule must have a days array');
    }

    if (!schedule.startTime || typeof schedule.startTime !== 'string') {
      throw new BadRequestException('Availability schedule must have a startTime string');
    }

    if (!schedule.endTime || typeof schedule.endTime !== 'string') {
      throw new BadRequestException('Availability schedule must have an endTime string');
    }

    if (!schedule.timezone || typeof schedule.timezone !== 'string') {
      throw new BadRequestException('Availability schedule must have a timezone string');
    }
  }

  /**
   * Validate professional credentials structure
   */
  private validateProfessionalCredentialsStructure(credentials: any): void {
    if (typeof credentials !== 'object' || credentials === null) {
      throw new BadRequestException('Professional credentials must be an object');
    }

    if (credentials.certifications && !Array.isArray(credentials.certifications)) {
      throw new BadRequestException('Certifications must be an array');
    }

    if (credentials.experience && typeof credentials.experience !== 'string') {
      throw new BadRequestException('Experience must be a string');
    }

    if (credentials.insurance !== undefined && typeof credentials.insurance !== 'boolean') {
      throw new BadRequestException('Insurance must be a boolean');
    }
  }

  /**
   * Validate company info structure
   */
  private validateCompanyInfoStructure(companyInfo: any): void {
    if (typeof companyInfo !== 'object' || companyInfo === null) {
      throw new BadRequestException('Company info must be an object');
    }

    if (companyInfo.name && typeof companyInfo.name !== 'string') {
      throw new BadRequestException('Company name must be a string');
    }

    if (companyInfo.size && typeof companyInfo.size !== 'string') {
      throw new BadRequestException('Company size must be a string');
    }

    if (companyInfo.industry && typeof companyInfo.industry !== 'string') {
      throw new BadRequestException('Company industry must be a string');
    }

    if (companyInfo.website && typeof companyInfo.website !== 'string') {
      throw new BadRequestException('Company website must be a string');
    }
  }

  /**
   * Validate contact preferences structure
   */
  private validateContactPreferencesStructure(preferences: any): void {
    if (typeof preferences !== 'object' || preferences === null) {
      throw new BadRequestException('Contact preferences must be an object');
    }

    if (preferences.allowCalls !== undefined && typeof preferences.allowCalls !== 'boolean') {
      throw new BadRequestException('Allow calls must be a boolean');
    }

    if (preferences.allowMessages !== undefined && typeof preferences.allowMessages !== 'boolean') {
      throw new BadRequestException('Allow messages must be a boolean');
    }

    if (preferences.allowWhatsApp !== undefined && typeof preferences.allowWhatsApp !== 'boolean') {
      throw new BadRequestException('Allow WhatsApp must be a boolean');
    }

    if (preferences.preferredTime && typeof preferences.preferredTime !== 'string') {
      throw new BadRequestException('Preferred time must be a string');
    }
  }

  /**
   * Validate business constraints
   */
  private validateBusinessConstraints(listingData: any): void {
    // Validate listing type specific constraints
    switch (listingData.listingType) {
      case 'property':
        this.validatePropertyConstraints(listingData);
        break;
      case 'item':
        this.validateItemConstraints(listingData);
        break;
      case 'service':
        this.validateServiceConstraints(listingData);
        break;
      case 'job':
        this.validateJobConstraints(listingData);
        break;
    }
  }

  /**
   * Validate property constraints
   */
  private validatePropertyConstraints(listingData: any): void {
    if (!listingData.propertyType) {
      throw new BadRequestException('Property type is required for property listings');
    }

    if (listingData.bedrooms !== undefined && listingData.bedrooms < 0) {
      throw new BadRequestException('Number of bedrooms cannot be negative');
    }

    if (listingData.bathrooms !== undefined && listingData.bathrooms < 0) {
      throw new BadRequestException('Number of bathrooms cannot be negative');
    }
  }

  /**
   * Validate item constraints
   */
  private validateItemConstraints(listingData: any): void {
    if (!listingData.condition) {
      throw new BadRequestException('Item condition is required for item listings');
    }
  }

  /**
   * Validate service constraints
   */
  private validateServiceConstraints(listingData: any): void {
    if (!listingData.serviceType) {
      throw new BadRequestException('Service type is required for service listings');
    }

    if (!listingData.pricingModel) {
      throw new BadRequestException('Pricing model is required for service listings');
    }
  }

  /**
   * Validate job constraints
   */
  private validateJobConstraints(listingData: any): void {
    if (!listingData.employmentType) {
      throw new BadRequestException('Employment type is required for job listings');
    }

    if (!listingData.workLocation) {
      throw new BadRequestException('Work location is required for job listings');
    }

    if (!listingData.requiredSkills || listingData.requiredSkills.length === 0) {
      throw new BadRequestException('At least one skill is required for job listings');
    }
  }

  /**
   * Validate listing update integrity
   */
  async validateListingUpdateIntegrity(
    listingId: string,
    updateData: any,
  ): Promise<void> {
    // Get existing listing
    const existingListing = await this.listingRepository.findOne({
      where: { id: listingId },
    });

    if (!existingListing) {
      throw new BadRequestException('Listing not found');
    }

    // Validate category change
    if (updateData.categoryId && updateData.categoryId !== existingListing.categoryId) {
      const category = await this.categoryRepository.findOne({
        where: { id: updateData.categoryId },
      });
      if (!category) {
        throw new BadRequestException('Category not found');
      }
    }

    // Validate listing type change
    if (updateData.listingType && updateData.listingType !== existingListing.listingType) {
      throw new BadRequestException('Cannot change listing type after creation');
    }

    // Validate data consistency for updates
    this.validateDataConsistency({ ...existingListing, ...updateData });
  }
}
