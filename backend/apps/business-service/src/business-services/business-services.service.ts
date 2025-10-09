import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessService } from '@app/database/entities/business-service.entity';
import { BusinessProfile } from '@app/database/entities/business-profile.entity';
import { CreateBusinessServiceDto } from '../dto/create-business-service.dto';
import { UpdateBusinessServiceDto } from '../dto/update-business-service.dto';

@Injectable()
export class BusinessServicesService {
  constructor(
    @InjectRepository(BusinessService)
    private businessServiceRepo: Repository<BusinessService>,
    @InjectRepository(BusinessProfile)
    private businessProfileRepo: Repository<BusinessProfile>,
  ) {}

  async create(
    businessId: string,
    userId: string,
    createDto: CreateBusinessServiceDto,
  ): Promise<BusinessService> {
    // Verify business ownership
    const business = await this.businessProfileRepo.findOne({
      where: { id: businessId, userId },
    });

    if (!business) {
      throw new ForbiddenException(
        'You do not have permission to add services to this business',
      );
    }

    const service = this.businessServiceRepo.create({
      businessId,
      ...createDto,
      isActive: createDto.isActive ?? true,
    });

    return await this.businessServiceRepo.save(service);
  }

  async findByBusinessId(businessId: string): Promise<BusinessService[]> {
    return await this.businessServiceRepo.find({
      where: { businessId, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<BusinessService> {
    const service = await this.businessServiceRepo.findOne({
      where: { id },
      relations: ['business'],
    });

    if (!service) {
      throw new NotFoundException('Business service not found');
    }

    return service;
  }

  async update(
    id: string,
    userId: string,
    updateDto: UpdateBusinessServiceDto,
  ): Promise<BusinessService> {
    const service = await this.findById(id);

    // Verify business ownership
    const business = await this.businessProfileRepo.findOne({
      where: { id: service.businessId, userId },
    });

    if (!business) {
      throw new ForbiddenException(
        'You do not have permission to update this service',
      );
    }

    Object.assign(service, updateDto);
    return await this.businessServiceRepo.save(service);
  }

  async delete(id: string, userId: string): Promise<void> {
    const service = await this.findById(id);

    // Verify business ownership
    const business = await this.businessProfileRepo.findOne({
      where: { id: service.businessId, userId },
    });

    if (!business) {
      throw new ForbiddenException(
        'You do not have permission to delete this service',
      );
    }

    await this.businessServiceRepo.remove(service);
  }

  async toggleActive(id: string, userId: string): Promise<BusinessService> {
    const service = await this.findById(id);

    // Verify business ownership
    const business = await this.businessProfileRepo.findOne({
      where: { id: service.businessId, userId },
    });

    if (!business) {
      throw new ForbiddenException(
        'You do not have permission to update this service',
      );
    }

    service.isActive = !service.isActive;
    return await this.businessServiceRepo.save(service);
  }
}
