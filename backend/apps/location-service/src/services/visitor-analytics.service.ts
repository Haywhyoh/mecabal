import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VisitorPass, VisitorPassStatus } from '@app/database/entities';
import { EstateManagementService } from './estate-management.service';

export interface VisitorStats {
  total: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
  checkedIn: number;
  pending: number;
  expired: number;
}

export interface PeakHoursData {
  hour: number;
  count: number;
}

export interface FrequentVisitor {
  visitorId: string;
  visitorName: string;
  visitCount: number;
  lastVisit: Date;
}

@Injectable()
export class VisitorAnalyticsService {
  constructor(
    @InjectRepository(VisitorPass)
    private readonly visitorPassRepository: Repository<VisitorPass>,
    private readonly estateManagementService: EstateManagementService,
  ) {}

  /**
   * Get visitor statistics for an estate
   */
  async getVisitorStats(
    estateId: string,
    userId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<VisitorStats> {
    const isAdmin = await this.estateManagementService.isEstateAdmin(userId, estateId);
    if (!isAdmin) {
      throw new ForbiddenException('Only estate administrators can view analytics');
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date(todayStart);
    monthStart.setMonth(monthStart.getMonth() - 1);

    const baseQuery = this.visitorPassRepository
      .createQueryBuilder('pass')
      .where('pass.estateId = :estateId', { estateId });

    if (startDate) {
      baseQuery.andWhere('pass.createdAt >= :startDate', { startDate });
    }
    if (endDate) {
      baseQuery.andWhere('pass.createdAt <= :endDate', { endDate });
    }

    const [
      total,
      today,
      thisWeek,
      thisMonth,
      checkedIn,
      pending,
      expired,
    ] = await Promise.all([
      baseQuery.getCount(),
      baseQuery
        .clone()
        .andWhere('pass.createdAt >= :todayStart', { todayStart })
        .getCount(),
      baseQuery
        .clone()
        .andWhere('pass.createdAt >= :weekStart', { weekStart })
        .getCount(),
      baseQuery
        .clone()
        .andWhere('pass.createdAt >= :monthStart', { monthStart })
        .getCount(),
      baseQuery
        .clone()
        .andWhere('pass.status = :status', { status: VisitorPassStatus.CHECKED_IN })
        .getCount(),
      baseQuery
        .clone()
        .andWhere('pass.status = :status', { status: VisitorPassStatus.PENDING })
        .getCount(),
      baseQuery
        .clone()
        .andWhere('pass.status = :status', { status: VisitorPassStatus.EXPIRED })
        .getCount(),
    ]);

    return {
      total,
      today,
      thisWeek,
      thisMonth,
      checkedIn,
      pending,
      expired,
    };
  }

  /**
   * Get peak hours analysis
   */
  async getPeakHours(
    estateId: string,
    userId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<PeakHoursData[]> {
    const isAdmin = await this.estateManagementService.isEstateAdmin(userId, estateId);
    if (!isAdmin) {
      throw new ForbiddenException('Only estate administrators can view analytics');
    }

    const query = this.visitorPassRepository
      .createQueryBuilder('pass')
      .select('EXTRACT(HOUR FROM pass.checkedInAt)', 'hour')
      .addSelect('COUNT(*)', 'count')
      .where('pass.estateId = :estateId', { estateId })
      .andWhere('pass.checkedInAt IS NOT NULL')
      .groupBy('hour')
      .orderBy('count', 'DESC');

    if (startDate) {
      query.andWhere('pass.checkedInAt >= :startDate', { startDate });
    }
    if (endDate) {
      query.andWhere('pass.checkedInAt <= :endDate', { endDate });
    }

    const results = await query.getRawMany();

    // Initialize all 24 hours with 0 count
    const hoursData: PeakHoursData[] = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      count: 0,
    }));

    // Fill in actual data
    results.forEach((result) => {
      const hour = parseInt(result.hour, 10);
      if (hour >= 0 && hour < 24) {
        hoursData[hour].count = parseInt(result.count, 10);
      }
    });

    return hoursData;
  }

  /**
   * Get frequent visitors
   */
  async getFrequentVisitors(
    estateId: string,
    userId: string,
    limit: number = 10,
    startDate?: Date,
    endDate?: Date,
  ): Promise<FrequentVisitor[]> {
    const isAdmin = await this.estateManagementService.isEstateAdmin(userId, estateId);
    if (!isAdmin) {
      throw new ForbiddenException('Only estate administrators can view analytics');
    }

    const query = this.visitorPassRepository
      .createQueryBuilder('pass')
      .leftJoinAndSelect('pass.visitor', 'visitor')
      .select('pass.visitorId', 'visitorId')
      .addSelect('visitor.fullName', 'visitorName')
      .addSelect('COUNT(*)', 'visitCount')
      .addSelect('MAX(pass.createdAt)', 'lastVisit')
      .where('pass.estateId = :estateId', { estateId })
      .groupBy('pass.visitorId')
      .addGroupBy('visitor.fullName')
      .orderBy('visitCount', 'DESC')
      .limit(limit);

    if (startDate) {
      query.andWhere('pass.createdAt >= :startDate', { startDate });
    }
    if (endDate) {
      query.andWhere('pass.createdAt <= :endDate', { endDate });
    }

    const results = await query.getRawMany();

    return results.map((result) => ({
      visitorId: result.visitorId,
      visitorName: result.visitorName,
      visitCount: parseInt(result.visitCount, 10),
      lastVisit: new Date(result.lastVisit),
    }));
  }

  /**
   * Get daily visitor counts for a date range
   */
  async getDailyVisitorCounts(
    estateId: string,
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Array<{ date: string; count: number }>> {
    const isAdmin = await this.estateManagementService.isEstateAdmin(userId, estateId);
    if (!isAdmin) {
      throw new ForbiddenException('Only estate administrators can view analytics');
    }

    const query = this.visitorPassRepository
      .createQueryBuilder('pass')
      .select('DATE(pass.createdAt)', 'date')
      .addSelect('COUNT(*)', 'count')
      .where('pass.estateId = :estateId', { estateId })
      .andWhere('pass.createdAt >= :startDate', { startDate })
      .andWhere('pass.createdAt <= :endDate', { endDate })
      .groupBy('date')
      .orderBy('date', 'ASC');

    const results = await query.getRawMany();

    return results.map((result) => ({
      date: result.date,
      count: parseInt(result.count, 10),
    }));
  }
}

















