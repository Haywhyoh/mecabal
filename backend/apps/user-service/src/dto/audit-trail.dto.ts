import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString, IsNumber, IsEnum, IsArray, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class AuditTrailQueryDto {
  @ApiProperty({
    description: 'User ID to filter by',
    example: 'uuid-here',
    required: false,
  })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiProperty({
    description: 'Verification type to filter by',
    example: 'nin',
    required: false,
  })
  @IsString()
  @IsOptional()
  verificationType?: string;

  @ApiProperty({
    description: 'Action to filter by',
    example: 'initiated',
    required: false,
  })
  @IsString()
  @IsOptional()
  action?: string;

  @ApiProperty({
    description: 'Status to filter by',
    example: 'success',
    required: false,
  })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({
    description: 'User who performed the action',
    example: 'uuid-here',
    required: false,
  })
  @IsString()
  @IsOptional()
  performedBy?: string;

  @ApiProperty({
    description: 'Start date for filtering',
    example: '2024-01-01',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({
    description: 'End date for filtering',
    example: '2024-12-31',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiProperty({
    description: 'IP address to filter by',
    example: '192.168.1.1',
    required: false,
  })
  @IsString()
  @IsOptional()
  ipAddress?: string;

  @ApiProperty({
    description: 'Number of records to return',
    example: 50,
    minimum: 1,
    maximum: 1000,
    required: false,
  })
  @IsNumber()
  @Min(1)
  @Max(1000)
  @IsOptional()
  @Type(() => Number)
  limit?: number = 50;

  @ApiProperty({
    description: 'Number of records to skip',
    example: 0,
    minimum: 0,
    required: false,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  offset?: number = 0;

  @ApiProperty({
    description: 'Field to sort by',
    example: 'createdAt',
    enum: ['createdAt', 'verificationType', 'action'],
    required: false,
  })
  @IsEnum(['createdAt', 'verificationType', 'action'])
  @IsOptional()
  sortBy?: 'createdAt' | 'verificationType' | 'action' = 'createdAt';

  @ApiProperty({
    description: 'Sort order',
    example: 'DESC',
    enum: ['ASC', 'DESC'],
    required: false,
  })
  @IsEnum(['ASC', 'DESC'])
  @IsOptional()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}

export class AuditTrailStatsDto {
  @ApiProperty({
    description: 'Total number of audit entries',
    example: 1000,
  })
  totalAudits: number;

  @ApiProperty({
    description: 'Number of audits by verification type',
    example: { nin: 500, document: 300, badge: 200 },
  })
  auditsByType: Record<string, number>;

  @ApiProperty({
    description: 'Number of audits by action',
    example: { initiated: 400, verified: 300, failed: 300 },
  })
  auditsByAction: Record<string, number>;

  @ApiProperty({
    description: 'Number of audits by status',
    example: { success: 800, failed: 200 },
  })
  auditsByStatus: Record<string, number>;

  @ApiProperty({
    description: 'Recent audit entries',
    type: 'array',
  })
  recentAudits: any[];

  @ApiProperty({
    description: 'Top users by audit count',
    type: 'array',
    example: [{ userId: 'uuid-1', count: 100 }, { userId: 'uuid-2', count: 80 }],
  })
  topUsers: Array<{ userId: string; count: number }>;

  @ApiProperty({
    description: 'Daily audit statistics',
    type: 'array',
    example: [{ date: '2024-01-01', count: 50 }, { date: '2024-01-02', count: 60 }],
  })
  dailyStats: Array<{ date: string; count: number }>;
}

export class AuditTrailResponseDto {
  @ApiProperty({
    description: 'Whether the request was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Audit trail data',
    type: 'object',
  })
  data: {
    audits: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };

  @ApiProperty({
    description: 'Response message',
    example: 'Audit trail retrieved successfully',
  })
  message: string;
}

export class AuditTrailStatsResponseDto {
  @ApiProperty({
    description: 'Whether the request was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Audit trail statistics',
    type: AuditTrailStatsDto,
  })
  data: AuditTrailStatsDto;

  @ApiProperty({
    description: 'Response message',
    example: 'Audit trail statistics retrieved successfully',
  })
  message: string;
}

export class AuditSummaryDto {
  @ApiProperty({
    description: 'Total number of audit entries',
    example: 10000,
  })
  totalAudits: number;

  @ApiProperty({
    description: 'Number of audits today',
    example: 50,
  })
  todayAudits: number;

  @ApiProperty({
    description: 'Number of failed audits',
    example: 100,
  })
  failedAudits: number;

  @ApiProperty({
    description: 'Top actions by count',
    type: 'array',
    example: [{ action: 'initiated', count: 1000 }, { action: 'verified', count: 800 }],
  })
  topActions: Array<{ action: string; count: number }>;

  @ApiProperty({
    description: 'Recent audit activity',
    type: 'array',
  })
  recentActivity: any[];
}

export class AuditSummaryResponseDto {
  @ApiProperty({
    description: 'Whether the request was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Audit summary data',
    type: AuditSummaryDto,
  })
  data: AuditSummaryDto;

  @ApiProperty({
    description: 'Response message',
    example: 'Audit summary retrieved successfully',
  })
  message: string;
}

export class MultiTypeAuditQueryDto {
  @ApiProperty({
    description: 'Array of verification types to filter by',
    example: ['nin', 'document', 'badge'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  verificationTypes: string[];

  @ApiProperty({
    description: 'Number of records to return',
    example: 50,
    minimum: 1,
    maximum: 1000,
    required: false,
  })
  @IsNumber()
  @Min(1)
  @Max(1000)
  @IsOptional()
  @Type(() => Number)
  limit?: number = 50;

  @ApiProperty({
    description: 'Number of records to skip',
    example: 0,
    minimum: 0,
    required: false,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  offset?: number = 0;
}

export class ExportAuditTrailDto {
  @ApiProperty({
    description: 'Whether the request was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'CSV data',
    example: 'ID,User ID,Verification Type,Action,Status...',
  })
  data: string;

  @ApiProperty({
    description: 'Response message',
    example: 'Audit trail exported successfully',
  })
  message: string;
}
