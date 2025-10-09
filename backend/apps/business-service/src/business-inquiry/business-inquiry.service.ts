import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessInquiry } from '@app/database/entities/business-inquiry.entity';
import { BusinessProfile } from '@app/database/entities/business-profile.entity';
import {
  CreateBusinessInquiryDto,
  RespondToInquiryDto,
  UpdateInquiryStatusDto,
  InquiryStatus,
} from '../dto/inquiry.dto';
import { BusinessActivityService, ActivityType } from '../business-activity/business-activity.service';

@Injectable()
export class BusinessInquiryService {
  constructor(
    @InjectRepository(BusinessInquiry)
    private inquiryRepo: Repository<BusinessInquiry>,
    @InjectRepository(BusinessProfile)
    private businessRepo: Repository<BusinessProfile>,
    private activityService: BusinessActivityService,
  ) {}

  async create(
    businessId: string,
    userId: string,
    createDto: CreateBusinessInquiryDto,
  ): Promise<BusinessInquiry> {
    // Verify business exists
    const business = await this.businessRepo.findOne({
      where: { id: businessId, isActive: true },
    });

    if (!business) {
      throw new NotFoundException('Business not found or inactive');
    }

    const inquiry = this.inquiryRepo.create({
      businessId,
      userId,
      ...createDto,
      status: InquiryStatus.PENDING,
    });

    const savedInquiry = await this.inquiryRepo.save(inquiry);

    // Log activity
    await this.activityService.logActivity(
      businessId,
      ActivityType.INQUIRY_RECEIVED,
      {
        inquiryId: savedInquiry.id,
        inquiryType: createDto.inquiryType,
      },
    );

    return savedInquiry;
  }

  async findByBusiness(
    businessId: string,
    status?: InquiryStatus,
  ): Promise<BusinessInquiry[]> {
    const query: any = { businessId };
    if (status) {
      query.status = status;
    }

    return await this.inquiryRepo.find({
      where: query,
      order: { createdAt: 'DESC' },
      relations: ['user'],
    });
  }

  async findByUser(userId: string): Promise<BusinessInquiry[]> {
    return await this.inquiryRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      relations: ['business'],
    });
  }

  async findById(id: string): Promise<BusinessInquiry> {
    const inquiry = await this.inquiryRepo.findOne({
      where: { id },
      relations: ['business', 'user'],
    });

    if (!inquiry) {
      throw new NotFoundException('Inquiry not found');
    }

    return inquiry;
  }

  async respond(
    id: string,
    businessOwnerId: string,
    respondDto: RespondToInquiryDto,
  ): Promise<BusinessInquiry> {
    const inquiry = await this.findById(id);

    // Verify business ownership
    if (inquiry.business.userId !== businessOwnerId) {
      throw new ForbiddenException('You do not own this business');
    }

    inquiry.response = respondDto.response;
    inquiry.respondedAt = new Date();
    inquiry.status = InquiryStatus.RESPONDED;

    return await this.inquiryRepo.save(inquiry);
  }

  async updateStatus(
    id: string,
    businessOwnerId: string,
    updateDto: UpdateInquiryStatusDto,
  ): Promise<BusinessInquiry> {
    const inquiry = await this.findById(id);

    if (inquiry.business.userId !== businessOwnerId) {
      throw new ForbiddenException('You do not own this business');
    }

    inquiry.status = updateDto.status;
    return await this.inquiryRepo.save(inquiry);
  }

  async getInquiryStats(businessId: string) {
    const inquiries = await this.inquiryRepo.find({
      where: { businessId },
    });

    const total = inquiries.length;
    const pending = inquiries.filter(
      (i) => i.status === InquiryStatus.PENDING,
    ).length;
    const responded = inquiries.filter(
      (i) => i.status === InquiryStatus.RESPONDED,
    ).length;
    const closed = inquiries.filter(
      (i) => i.status === InquiryStatus.CLOSED,
    ).length;

    const responseRate =
      total > 0 ? Number((((responded + closed) / total) * 100).toFixed(2)) : 0;

    return {
      total,
      pending,
      responded,
      closed,
      responseRate,
    };
  }
}
