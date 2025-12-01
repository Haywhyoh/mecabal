import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { VisitorPass, VisitorPassStatus } from '@app/database/entities';
import { EstateManagementService } from './estate-management.service';

export interface VisitorLogFilters {
  startDate?: Date;
  endDate?: Date;
  status?: VisitorPassStatus;
  hostId?: string;
  visitorId?: string;
  limit?: number;
  offset?: number;
}

@Injectable()
export class VisitorLogService {
  constructor(
    @InjectRepository(VisitorPass)
    private readonly visitorPassRepository: Repository<VisitorPass>,
    private readonly estateManagementService: EstateManagementService,
  ) {}

  /**
   * Get real-time visitor logs for an estate
   */
  async getVisitorLogs(
    estateId: string,
    userId: string,
    filters?: VisitorLogFilters,
  ): Promise<{
    data: VisitorPass[];
    total: number;
  }> {
    const isAdmin = await this.estateManagementService.isEstateAdmin(userId, estateId);
    if (!isAdmin) {
      throw new ForbiddenException('Only estate administrators can view visitor logs');
    }

    const query = this.visitorPassRepository
      .createQueryBuilder('pass')
      .leftJoinAndSelect('pass.visitor', 'visitor')
      .leftJoinAndSelect('pass.host', 'host')
      .where('pass.estateId = :estateId', { estateId })
      .orderBy('pass.createdAt', 'DESC');

    // Apply filters
    if (filters?.startDate) {
      query.andWhere('pass.createdAt >= :startDate', { startDate: filters.startDate });
    }

    if (filters?.endDate) {
      query.andWhere('pass.createdAt <= :endDate', { endDate: filters.endDate });
    }

    if (filters?.status) {
      query.andWhere('pass.status = :status', { status: filters.status });
    }

    if (filters?.hostId) {
      query.andWhere('pass.hostId = :hostId', { hostId: filters.hostId });
    }

    if (filters?.visitorId) {
      query.andWhere('pass.visitorId = :visitorId', { visitorId: filters.visitorId });
    }

    // Get total count
    const total = await query.getCount();

    // Apply pagination
    if (filters?.limit) {
      query.limit(filters.limit);
    }
    if (filters?.offset) {
      query.offset(filters.offset);
    }

    const data = await query.getMany();

    return { data, total };
  }

  /**
   * Get current active visitors (checked in but not checked out)
   */
  async getCurrentVisitors(
    estateId: string,
    userId: string,
  ): Promise<VisitorPass[]> {
    const isAdmin = await this.estateManagementService.isEstateAdmin(userId, estateId);
    if (!isAdmin) {
      throw new ForbiddenException('Only estate administrators can view current visitors');
    }

    return this.visitorPassRepository.find({
      where: {
        estateId,
        status: VisitorPassStatus.CHECKED_IN,
      },
      relations: ['visitor', 'host'],
      order: { checkedInAt: 'DESC' },
    });
  }

  /**
   * Get visitor history for a specific visitor
   */
  async getVisitorHistory(
    visitorId: string,
    estateId: string,
    userId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<{
    data: VisitorPass[];
    total: number;
  }> {
    const isAdmin = await this.estateManagementService.isEstateAdmin(userId, estateId);
    if (!isAdmin) {
      throw new ForbiddenException('Only estate administrators can view visitor history');
    }

    const [data, total] = await this.visitorPassRepository.findAndCount({
      where: {
        visitorId,
        estateId,
      },
      relations: ['host'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return { data, total };
  }
}


