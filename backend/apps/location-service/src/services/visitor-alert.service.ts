import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VisitorAlert, AlertSeverity, AlertType, AlertStatus } from '@app/database/entities';
import { EstateManagementService } from './estate-management.service';

export interface CreateAlertDto {
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  location?: string;
  gateName?: string;
  qrCode?: string;
  visitorId?: string;
  visitorPassId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface AlertFilters {
  severity?: AlertSeverity;
  status?: AlertStatus;
  type?: AlertType;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

@Injectable()
export class VisitorAlertService {
  constructor(
    @InjectRepository(VisitorAlert)
    private readonly alertRepository: Repository<VisitorAlert>,
    private readonly estateManagementService: EstateManagementService,
  ) {}

  /**
   * Create a security alert
   */
  async createAlert(
    estateId: string,
    userId: string,
    dto: CreateAlertDto,
  ): Promise<VisitorAlert> {
    const isAdmin = await this.estateManagementService.isEstateAdmin(userId, estateId);
    if (!isAdmin) {
      throw new ForbiddenException('Only estate administrators can create alerts');
    }

    const alert = this.alertRepository.create({
      ...dto,
      estateId,
      ipAddress: dto.ipAddress,
      userAgent: dto.userAgent,
    });

    return this.alertRepository.save(alert);
  }

  /**
   * Create a system-generated alert (bypasses admin check)
   */
  async createSystemAlert(
    estateId: string,
    dto: CreateAlertDto,
  ): Promise<VisitorAlert> {
    const alert = this.alertRepository.create({
      ...dto,
      estateId,
      ipAddress: dto.ipAddress,
      userAgent: dto.userAgent,
    });

    return this.alertRepository.save(alert);
  }

  /**
   * Get alerts for an estate
   */
  async getAlerts(
    estateId: string,
    userId: string,
    filters?: AlertFilters,
  ): Promise<{
    data: VisitorAlert[];
    total: number;
  }> {
    const isAdmin = await this.estateManagementService.isEstateAdmin(userId, estateId);
    if (!isAdmin) {
      throw new ForbiddenException('Only estate administrators can view alerts');
    }

    const query = this.alertRepository
      .createQueryBuilder('alert')
      .leftJoinAndSelect('alert.visitor', 'visitor')
      .leftJoinAndSelect('alert.resolver', 'resolver')
      .where('alert.estateId = :estateId', { estateId })
      .orderBy('alert.createdAt', 'DESC');

    if (filters?.severity) {
      query.andWhere('alert.severity = :severity', { severity: filters.severity });
    }

    if (filters?.status) {
      query.andWhere('alert.status = :status', { status: filters.status });
    }

    if (filters?.type) {
      query.andWhere('alert.type = :type', { type: filters.type });
    }

    if (filters?.startDate) {
      query.andWhere('alert.createdAt >= :startDate', { startDate: filters.startDate });
    }

    if (filters?.endDate) {
      query.andWhere('alert.createdAt <= :endDate', { endDate: filters.endDate });
    }

    const total = await query.getCount();

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
   * Get alert by ID
   */
  async getAlertById(
    alertId: string,
    estateId: string,
    userId: string,
  ): Promise<VisitorAlert> {
    const isAdmin = await this.estateManagementService.isEstateAdmin(userId, estateId);
    if (!isAdmin) {
      throw new ForbiddenException('Only estate administrators can view alerts');
    }

    const alert = await this.alertRepository.findOne({
      where: { id: alertId, estateId },
      relations: ['visitor', 'resolver'],
    });

    if (!alert) {
      throw new NotFoundException(`Alert with ID ${alertId} not found`);
    }

    return alert;
  }

  /**
   * Update alert status
   */
  async updateAlertStatus(
    alertId: string,
    estateId: string,
    userId: string,
    status: AlertStatus,
    resolutionNotes?: string,
  ): Promise<VisitorAlert> {
    const isAdmin = await this.estateManagementService.isEstateAdmin(userId, estateId);
    if (!isAdmin) {
      throw new ForbiddenException('Only estate administrators can update alerts');
    }

    const alert = await this.alertRepository.findOne({
      where: { id: alertId, estateId },
    });

    if (!alert) {
      throw new NotFoundException(`Alert with ID ${alertId} not found`);
    }

    alert.status = status;
    if (status === AlertStatus.RESOLVED || status === AlertStatus.DISMISSED) {
      alert.resolvedBy = userId;
      alert.resolvedAt = new Date();
      if (resolutionNotes) {
        alert.resolutionNotes = resolutionNotes;
      }
    }

    return this.alertRepository.save(alert);
  }

  /**
   * Get alert statistics
   */
  async getAlertStats(
    estateId: string,
    userId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    total: number;
    open: number;
    investigating: number;
    resolved: number;
    dismissed: number;
    bySeverity: {
      low: number;
      medium: number;
      high: number;
      critical: number;
    };
  }> {
    const isAdmin = await this.estateManagementService.isEstateAdmin(userId, estateId);
    if (!isAdmin) {
      throw new ForbiddenException('Only estate administrators can view alert statistics');
    }

    const query = this.alertRepository
      .createQueryBuilder('alert')
      .where('alert.estateId = :estateId', { estateId });

    if (startDate) {
      query.andWhere('alert.createdAt >= :startDate', { startDate });
    }
    if (endDate) {
      query.andWhere('alert.createdAt <= :endDate', { endDate });
    }

    const [
      total,
      open,
      investigating,
      resolved,
      dismissed,
      low,
      medium,
      high,
      critical,
    ] = await Promise.all([
      query.getCount(),
      query.clone().andWhere('alert.status = :status', { status: AlertStatus.OPEN }).getCount(),
      query.clone().andWhere('alert.status = :status', { status: AlertStatus.INVESTIGATING }).getCount(),
      query.clone().andWhere('alert.status = :status', { status: AlertStatus.RESOLVED }).getCount(),
      query.clone().andWhere('alert.status = :status', { status: AlertStatus.DISMISSED }).getCount(),
      query.clone().andWhere('alert.severity = :severity', { severity: AlertSeverity.LOW }).getCount(),
      query.clone().andWhere('alert.severity = :severity', { severity: AlertSeverity.MEDIUM }).getCount(),
      query.clone().andWhere('alert.severity = :severity', { severity: AlertSeverity.HIGH }).getCount(),
      query.clone().andWhere('alert.severity = :severity', { severity: AlertSeverity.CRITICAL }).getCount(),
    ]);

    return {
      total,
      open,
      investigating,
      resolved,
      dismissed,
      bySeverity: {
        low,
        medium,
        high,
        critical,
      },
    };
  }
}

