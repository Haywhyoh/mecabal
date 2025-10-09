import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { BusinessActivityLog } from '@app/database/entities/business-activity-log.entity';
import { BusinessProfile } from '@app/database/entities/business-profile.entity';

export enum ActivityType {
  JOB_COMPLETED = 'job_completed',
  REVIEW_RECEIVED = 'review_received',
  INQUIRY_RECEIVED = 'inquiry_received',
  PROFILE_UPDATED = 'profile_updated',
  PROFILE_VIEWED = 'profile_viewed',
  CONTACT_CLICKED = 'contact_clicked',
}

@Injectable()
export class BusinessActivityService {
  constructor(
    @InjectRepository(BusinessActivityLog)
    private activityRepo: Repository<BusinessActivityLog>,
    @InjectRepository(BusinessProfile)
    private businessRepo: Repository<BusinessProfile>,
  ) {}

  async logActivity(
    businessId: string,
    activityType: ActivityType,
    metadata?: Record<string, any>,
  ): Promise<BusinessActivityLog> {
    const activity = this.activityRepo.create({
      businessId,
      activityType,
      metadata,
    });

    return await this.activityRepo.save(activity);
  }

  async getRecentActivity(
    businessId: string,
    limit: number = 50,
  ): Promise<BusinessActivityLog[]> {
    return await this.activityRepo.find({
      where: { businessId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getAnalytics(businessId: string, period: '7d' | '30d' | '90d' | 'all') {
    const business = await this.businessRepo.findOne({
      where: { id: businessId },
    });

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    let startDate: Date;
    const endDate = new Date();

    switch (period) {
      case '7d':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
        startDate = business.createdAt;
        break;
    }

    const activities = await this.activityRepo.find({
      where: {
        businessId,
        createdAt: Between(startDate, endDate),
      },
    });

    // Calculate metrics
    const profileViews = activities.filter(
      (a) => a.activityType === ActivityType.PROFILE_VIEWED,
    ).length;

    const inquiriesReceived = activities.filter(
      (a) => a.activityType === ActivityType.INQUIRY_RECEIVED,
    ).length;

    const reviewsReceived = activities.filter(
      (a) => a.activityType === ActivityType.REVIEW_RECEIVED,
    ).length;

    const jobsCompleted = activities.filter(
      (a) => a.activityType === ActivityType.JOB_COMPLETED,
    ).length;

    const contactClicks = activities.filter(
      (a) => a.activityType === ActivityType.CONTACT_CLICKED,
    ).length;

    // Calculate conversion rate (inquiries to jobs)
    const conversionRate =
      inquiriesReceived > 0
        ? Number(((jobsCompleted / inquiriesReceived) * 100).toFixed(2))
        : 0;

    // Calculate engagement rate (contacts/views)
    const engagementRate =
      profileViews > 0
        ? Number(((contactClicks / profileViews) * 100).toFixed(2))
        : 0;

    return {
      period,
      startDate,
      endDate,
      metrics: {
        profileViews,
        inquiriesReceived,
        reviewsReceived,
        jobsCompleted,
        contactClicks,
        conversionRate,
        engagementRate,
      },
      business: {
        rating: business.rating,
        reviewCount: business.reviewCount,
        completedJobs: business.completedJobs,
        verificationLevel: business.verificationLevel,
        isVerified: business.isVerified,
      },
    };
  }

  async getDailyStats(businessId: string, days: number = 30) {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const activities = await this.activityRepo.find({
      where: {
        businessId,
        createdAt: Between(startDate, new Date()),
      },
      order: { createdAt: 'ASC' },
    });

      // Group by date
      const dailyStats: Record<string, {
        date: string;
        views: number;
        inquiries: number;
        reviews: number;
        jobs: number;
        contacts: number;
      }> = {};

    activities.forEach((activity) => {
      const date = activity.createdAt.toISOString().split('T')[0];

      if (!dailyStats[date]) {
        dailyStats[date] = {
          date,
          views: 0,
          inquiries: 0,
          reviews: 0,
          jobs: 0,
          contacts: 0,
        };
      }

      switch (activity.activityType) {
        case ActivityType.PROFILE_VIEWED:
          dailyStats[date].views++;
          break;
        case ActivityType.INQUIRY_RECEIVED:
          dailyStats[date].inquiries++;
          break;
        case ActivityType.REVIEW_RECEIVED:
          dailyStats[date].reviews++;
          break;
        case ActivityType.JOB_COMPLETED:
          dailyStats[date].jobs++;
          break;
        case ActivityType.CONTACT_CLICKED:
          dailyStats[date].contacts++;
          break;
      }
    });

    return Object.values(dailyStats);
  }
}
