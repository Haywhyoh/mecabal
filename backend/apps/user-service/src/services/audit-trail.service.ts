import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like, In } from 'typeorm';
import { VerificationAudit } from '@app/database';

export interface AuditTrailQuery {
  userId?: string;
  verificationType?: string;
  action?: string;
  status?: string;
  performedBy?: string;
  startDate?: Date;
  endDate?: Date;
  ipAddress?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'createdAt' | 'verificationType' | 'action';
  sortOrder?: 'ASC' | 'DESC';
}

export interface AuditTrailStats {
  totalAudits: number;
  auditsByType: Record<string, number>;
  auditsByAction: Record<string, number>;
  auditsByStatus: Record<string, number>;
  recentAudits: VerificationAudit[];
  topUsers: Array<{ userId: string; count: number }>;
  dailyStats: Array<{ date: string; count: number }>;
}

export interface AuditTrailResponse {
  audits: VerificationAudit[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class AuditTrailService {
  private readonly logger = new Logger(AuditTrailService.name);

  constructor(
    @InjectRepository(VerificationAudit)
    private readonly verificationAuditRepository: Repository<VerificationAudit>,
  ) {}

  /**
   * Get audit trail with filtering and pagination
   */
  async getAuditTrail(query: AuditTrailQuery): Promise<AuditTrailResponse> {
    try {
      const {
        userId,
        verificationType,
        action,
        status,
        performedBy,
        startDate,
        endDate,
        ipAddress,
        limit = 50,
        offset = 0,
        sortBy = 'createdAt',
        sortOrder = 'DESC',
      } = query;

      // Build query conditions
      const whereConditions: any = {};

      if (userId) {
        whereConditions.userId = userId;
      }

      if (verificationType) {
        whereConditions.verificationType = verificationType;
      }

      if (action) {
        whereConditions.action = action;
      }

      if (status) {
        whereConditions.status = status;
      }

      if (performedBy) {
        whereConditions.performedBy = performedBy;
      }

      if (ipAddress) {
        whereConditions.ipAddress = Like(`%${ipAddress}%`);
      }

      if (startDate && endDate) {
        whereConditions.createdAt = Between(startDate, endDate);
      } else if (startDate) {
        whereConditions.createdAt = Between(startDate, new Date());
      } else if (endDate) {
        whereConditions.createdAt = Between(new Date(0), endDate);
      }

      // Get total count
      const total = await this.verificationAuditRepository.count({
        where: whereConditions,
      });

      // Get audits with pagination
      const audits = await this.verificationAuditRepository.find({
        where: whereConditions,
        order: { [sortBy]: sortOrder },
        take: limit,
        skip: offset,
      });

      const totalPages = Math.ceil(total / limit);
      const page = Math.floor(offset / limit) + 1;

      return {
        audits,
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      this.logger.error('Error getting audit trail:', error);
      throw error;
    }
  }

  /**
   * Get audit trail statistics
   */
  async getAuditStats(
    userId?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<AuditTrailStats> {
    try {
      const whereConditions: any = {};

      if (userId) {
        whereConditions.userId = userId;
      }

      if (startDate && endDate) {
        whereConditions.createdAt = Between(startDate, endDate);
      } else if (startDate) {
        whereConditions.createdAt = Between(startDate, new Date());
      } else if (endDate) {
        whereConditions.createdAt = Between(new Date(0), endDate);
      }

      // Get all audits for statistics
      const audits = await this.verificationAuditRepository.find({
        where: whereConditions,
        order: { createdAt: 'DESC' },
      });

      // Calculate statistics
      const auditsByType = audits.reduce((acc, audit) => {
        acc[audit.verificationType] = (acc[audit.verificationType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const auditsByAction = audits.reduce((acc, audit) => {
        acc[audit.action] = (acc[audit.action] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const auditsByStatus = audits.reduce((acc, audit) => {
        acc[audit.status] = (acc[audit.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const userCounts = audits.reduce((acc, audit) => {
        if (audit.performedBy) {
          acc[audit.performedBy] = (acc[audit.performedBy] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      const topUsers = Object.entries(userCounts)
        .map(([userId, count]) => ({ userId, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Calculate daily stats for the last 30 days
      const dailyStats = this.calculateDailyStats(audits);

      const recentAudits = audits.slice(0, 10);

      return {
        totalAudits: audits.length,
        auditsByType,
        auditsByAction,
        auditsByStatus,
        recentAudits,
        topUsers,
        dailyStats,
      };
    } catch (error) {
      this.logger.error('Error getting audit stats:', error);
      throw error;
    }
  }

  /**
   * Get audit trail for a specific user
   */
  async getUserAuditTrail(
    userId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<AuditTrailResponse> {
    return this.getAuditTrail({
      userId,
      limit,
      offset,
    });
  }

  /**
   * Get audit trail by verification type
   */
  async getVerificationTypeAuditTrail(
    verificationType: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<AuditTrailResponse> {
    return this.getAuditTrail({
      verificationType,
      limit,
      offset,
    });
  }

  /**
   * Get audit trail by action
   */
  async getActionAuditTrail(
    action: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<AuditTrailResponse> {
    return this.getAuditTrail({
      action,
      limit,
      offset,
    });
  }

  /**
   * Get audit trail by date range
   */
  async getDateRangeAuditTrail(
    startDate: Date,
    endDate: Date,
    limit: number = 50,
    offset: number = 0,
  ): Promise<AuditTrailResponse> {
    return this.getAuditTrail({
      startDate,
      endDate,
      limit,
      offset,
    });
  }

  /**
   * Get audit trail by IP address
   */
  async getIpAddressAuditTrail(
    ipAddress: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<AuditTrailResponse> {
    return this.getAuditTrail({
      ipAddress,
      limit,
      offset,
    });
  }

  /**
   * Get failed audit entries
   */
  async getFailedAudits(
    limit: number = 50,
    offset: number = 0,
  ): Promise<AuditTrailResponse> {
    return this.getAuditTrail({
      status: 'failed',
      limit,
      offset,
    });
  }

  /**
   * Get successful audit entries
   */
  async getSuccessfulAudits(
    limit: number = 50,
    offset: number = 0,
  ): Promise<AuditTrailResponse> {
    return this.getAuditTrail({
      status: 'success',
      limit,
      offset,
    });
  }

  /**
   * Get audit trail by multiple verification types
   */
  async getMultiTypeAuditTrail(
    verificationTypes: string[],
    limit: number = 50,
    offset: number = 0,
  ): Promise<AuditTrailResponse> {
    try {
      const whereConditions: any = {
        verificationType: In(verificationTypes),
      };

      const total = await this.verificationAuditRepository.count({
        where: whereConditions,
      });

      const audits = await this.verificationAuditRepository.find({
        where: whereConditions,
        order: { createdAt: 'DESC' },
        take: limit,
        skip: offset,
      });

      const totalPages = Math.ceil(total / limit);
      const page = Math.floor(offset / limit) + 1;

      return {
        audits,
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      this.logger.error('Error getting multi-type audit trail:', error);
      throw error;
    }
  }

  /**
   * Get audit trail summary for dashboard
   */
  async getAuditSummary(): Promise<{
    totalAudits: number;
    todayAudits: number;
    failedAudits: number;
    topActions: Array<{ action: string; count: number }>;
    recentActivity: VerificationAudit[];
  }> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const [totalAudits, todayAudits, failedAudits, recentActivity] = await Promise.all([
        this.verificationAuditRepository.count(),
        this.verificationAuditRepository.count({
          where: { createdAt: Between(today, tomorrow) },
        }),
        this.verificationAuditRepository.count({
          where: { status: 'failed' },
        }),
        this.verificationAuditRepository.find({
          order: { createdAt: 'DESC' },
          take: 10,
        }),
      ]);

      // Get top actions
      const allAudits = await this.verificationAuditRepository.find();
      const actionCounts = allAudits.reduce((acc, audit) => {
        acc[audit.action] = (acc[audit.action] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const topActions = Object.entries(actionCounts)
        .map(([action, count]) => ({ action, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        totalAudits,
        todayAudits,
        failedAudits,
        topActions,
        recentActivity,
      };
    } catch (error) {
      this.logger.error('Error getting audit summary:', error);
      throw error;
    }
  }

  /**
   * Calculate daily statistics
   */
  private calculateDailyStats(audits: VerificationAudit[]): Array<{ date: string; count: number }> {
    const dailyCounts: Record<string, number> = {};
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    audits
      .filter(audit => audit.createdAt >= thirtyDaysAgo)
      .forEach(audit => {
        const date = audit.createdAt.toISOString().split('T')[0];
        dailyCounts[date] = (dailyCounts[date] || 0) + 1;
      });

    return Object.entries(dailyCounts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Export audit trail to CSV format
   */
  async exportAuditTrail(query: AuditTrailQuery): Promise<string> {
    try {
      const { audits } = await this.getAuditTrail({ ...query, limit: 10000 });

      const headers = [
        'ID',
        'User ID',
        'Verification Type',
        'Action',
        'Status',
        'IP Address',
        'User Agent',
        'Performed By',
        'Created At',
      ];

      const csvRows = [
        headers.join(','),
        ...audits.map(audit => [
          audit.id,
          audit.userId,
          audit.verificationType,
          audit.action,
          audit.status,
          audit.ipAddress || '',
          (audit.userAgent || '').replace(/,/g, ';'),
          audit.performedBy || '',
          audit.createdAt.toISOString(),
        ].join(',')),
      ];

      return csvRows.join('\n');
    } catch (error) {
      this.logger.error('Error exporting audit trail:', error);
      throw error;
    }
  }
}
