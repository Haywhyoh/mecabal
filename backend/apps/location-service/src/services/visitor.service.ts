import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { Visitor, VisitorPass, VisitorPassStatus, Neighborhood, User } from '@app/database/entities';
import { EstateManagementService } from './estate-management.service';
import * as crypto from 'crypto';

export interface PreRegisterVisitorDto {
  fullName: string;
  phoneNumber?: string;
  email?: string;
  photoUrl?: string;
  vehicleRegistration?: string;
  vehicleMake?: string;
  vehicleColor?: string;
  idCardNumber?: string;
  idCardType?: string;
  companyName?: string;
  purpose?: string;
  notes?: string;
}

export interface GenerateVisitorPassDto {
  visitorId: string;
  hostId: string;
  expectedArrival: Date;
  expiresAt: Date;
  guestCount?: number;
  purpose?: string;
  notes?: string;
}

@Injectable()
export class VisitorService {
  constructor(
    @InjectRepository(Visitor)
    private readonly visitorRepository: Repository<Visitor>,
    @InjectRepository(VisitorPass)
    private readonly visitorPassRepository: Repository<VisitorPass>,
    @InjectRepository(Neighborhood)
    private readonly neighborhoodRepository: Repository<Neighborhood>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly estateManagementService: EstateManagementService,
  ) {}

  /**
   * Pre-register a visitor for an estate
   */
  async preRegisterVisitor(
    estateId: string,
    userId: string,
    dto: PreRegisterVisitorDto,
  ): Promise<Visitor> {
    // Verify estate exists and user is admin
    const estate = await this.neighborhoodRepository.findOne({
      where: { id: estateId, type: 'ESTATE' as any },
    });

    if (!estate) {
      throw new NotFoundException(`Estate with ID ${estateId} not found`);
    }

    const isAdmin = await this.estateManagementService.isEstateAdmin(userId, estateId);
    if (!isAdmin) {
      throw new ForbiddenException('Only estate administrators can pre-register visitors');
    }

    // Check if visitor already exists (by phone or email)
    let visitor = await this.visitorRepository.findOne({
      where: [
        ...(dto.phoneNumber ? [{ phoneNumber: dto.phoneNumber, estateId }] : []),
        ...(dto.email ? [{ email: dto.email, estateId }] : []),
      ],
    });

    if (visitor) {
      // Update existing visitor
      Object.assign(visitor, dto);
      return this.visitorRepository.save(visitor);
    }

    // Create new visitor
    visitor = this.visitorRepository.create({
      ...dto,
      estateId,
    });

    return this.visitorRepository.save(visitor);
  }

  /**
   * Get all visitors for an estate
   */
  async getVisitors(estateId: string, userId: string): Promise<Visitor[]> {
    const isAdmin = await this.estateManagementService.isEstateAdmin(userId, estateId);
    if (!isAdmin) {
      throw new ForbiddenException('Only estate administrators can view visitors');
    }

    return this.visitorRepository.find({
      where: { estateId },
      relations: ['passes'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get visitor by ID
   */
  async getVisitorById(visitorId: string, estateId: string, userId: string): Promise<Visitor> {
    const isAdmin = await this.estateManagementService.isEstateAdmin(userId, estateId);
    if (!isAdmin) {
      throw new ForbiddenException('Only estate administrators can view visitor details');
    }

    const visitor = await this.visitorRepository.findOne({
      where: { id: visitorId, estateId },
      relations: ['passes', 'passes.host'],
    });

    if (!visitor) {
      throw new NotFoundException(`Visitor with ID ${visitorId} not found`);
    }

    return visitor;
  }

  /**
   * Update visitor information
   */
  async updateVisitor(
    visitorId: string,
    estateId: string,
    userId: string,
    dto: Partial<PreRegisterVisitorDto>,
  ): Promise<Visitor> {
    const isAdmin = await this.estateManagementService.isEstateAdmin(userId, estateId);
    if (!isAdmin) {
      throw new ForbiddenException('Only estate administrators can update visitors');
    }

    const visitor = await this.visitorRepository.findOne({
      where: { id: visitorId, estateId },
    });

    if (!visitor) {
      throw new NotFoundException(`Visitor with ID ${visitorId} not found`);
    }

    Object.assign(visitor, dto);
    return this.visitorRepository.save(visitor);
  }

  /**
   * Delete visitor
   */
  async deleteVisitor(visitorId: string, estateId: string, userId: string): Promise<void> {
    const isAdmin = await this.estateManagementService.isEstateAdmin(userId, estateId);
    if (!isAdmin) {
      throw new ForbiddenException('Only estate administrators can delete visitors');
    }

    const visitor = await this.visitorRepository.findOne({
      where: { id: visitorId, estateId },
    });

    if (!visitor) {
      throw new NotFoundException(`Visitor with ID ${visitorId} not found`);
    }

    await this.visitorRepository.remove(visitor);
  }

  /**
   * Generate a visitor pass with QR code
   */
  async generateVisitorPass(
    estateId: string,
    userId: string,
    dto: GenerateVisitorPassDto,
  ): Promise<VisitorPass> {
    // Verify estate exists
    const estate = await this.neighborhoodRepository.findOne({
      where: { id: estateId },
    });

    if (!estate) {
      throw new NotFoundException(`Estate with ID ${estateId} not found`);
    }

    // Verify visitor exists
    const visitor = await this.visitorRepository.findOne({
      where: { id: dto.visitorId, estateId },
    });

    if (!visitor) {
      throw new NotFoundException(`Visitor with ID ${dto.visitorId} not found`);
    }

    // Check if visitor is blacklisted
    if (visitor.isBlacklisted) {
      throw new BadRequestException('Cannot generate pass for blacklisted visitor');
    }

    // Verify host exists
    const host = await this.userRepository.findOne({
      where: { id: dto.hostId },
    });

    if (!host) {
      throw new NotFoundException(`Host with ID ${dto.hostId} not found`);
    }

    // Generate unique QR code token
    const qrToken = crypto.randomBytes(32).toString('hex');
    const passId = crypto.randomUUID();

    // Create QR payload
    const qrPayload = {
      passId,
      visitorId: dto.visitorId,
      estateId,
      hostId: dto.hostId,
      expiresAt: dto.expiresAt.toISOString(),
    };

    // Sign QR payload with JWT
    const qrCode = this.jwtService.sign(qrPayload, {
      secret: process.env.JWT_SECRET || 'visitor-pass-secret',
      expiresIn: Math.floor((dto.expiresAt.getTime() - Date.now()) / 1000), // Expires when pass expires
    });

    // Create visitor pass
    const pass = this.visitorPassRepository.create({
      id: passId,
      visitorId: dto.visitorId,
      hostId: dto.hostId,
      estateId,
      qrCode,
      qrPayload: JSON.stringify(qrPayload),
      status: VisitorPassStatus.PENDING,
      expectedArrival: dto.expectedArrival,
      expiresAt: dto.expiresAt,
      guestCount: dto.guestCount || 0,
      purpose: dto.purpose,
      notes: dto.notes,
    });

    return this.visitorPassRepository.save(pass);
  }

  /**
   * Validate QR code at entry gate
   */
  async validateQRCode(qrCode: string, gateName?: string): Promise<{
    valid: boolean;
    pass?: VisitorPass;
    message: string;
  }> {
    try {
      // Verify JWT signature
      const payload = this.jwtService.verify(qrCode, {
        secret: process.env.JWT_SECRET || 'visitor-pass-secret',
      });

      // Find pass by ID
      const pass = await this.visitorPassRepository.findOne({
        where: { id: payload.passId },
        relations: ['visitor', 'host', 'estate'],
      });

      if (!pass) {
        return {
          valid: false,
          message: 'Visitor pass not found',
        };
      }

      // Check if pass is expired
      if (new Date() > pass.expiresAt) {
        // Update status to expired
        pass.status = VisitorPassStatus.EXPIRED;
        await this.visitorPassRepository.save(pass);

        return {
          valid: false,
          pass,
          message: 'Visitor pass has expired',
        };
      }

      // Check if pass is revoked
      if (pass.status === VisitorPassStatus.REVOKED) {
        return {
          valid: false,
          pass,
          message: 'Visitor pass has been revoked',
        };
      }

      // Check if visitor is blacklisted
      if (pass.visitor.isBlacklisted) {
        return {
          valid: false,
          pass,
          message: 'Visitor is blacklisted',
        };
      }

      // All checks passed
      return {
        valid: true,
        pass,
        message: 'Visitor pass is valid',
      };
    } catch (error) {
      return {
        valid: false,
        message: 'Invalid QR code format or signature',
      };
    }
  }

  /**
   * Check in visitor
   */
  async checkInVisitor(
    passId: string,
    estateId: string,
    userId: string,
    gateName?: string,
  ): Promise<VisitorPass> {
    const isAdmin = await this.estateManagementService.isEstateAdmin(userId, estateId);
    if (!isAdmin) {
      throw new ForbiddenException('Only estate administrators can check in visitors');
    }

    const pass = await this.visitorPassRepository.findOne({
      where: { id: passId, estateId },
      relations: ['visitor'],
    });

    if (!pass) {
      throw new NotFoundException(`Visitor pass with ID ${passId} not found`);
    }

    if (pass.status === VisitorPassStatus.CHECKED_IN) {
      throw new BadRequestException('Visitor is already checked in');
    }

    if (pass.status === VisitorPassStatus.EXPIRED || pass.status === VisitorPassStatus.REVOKED) {
      throw new BadRequestException(`Cannot check in visitor with status: ${pass.status}`);
    }

    pass.status = VisitorPassStatus.CHECKED_IN;
    pass.checkedInAt = new Date();
    pass.entryGate = gateName;

    return this.visitorPassRepository.save(pass);
  }

  /**
   * Check out visitor
   */
  async checkOutVisitor(
    passId: string,
    estateId: string,
    userId: string,
    gateName?: string,
  ): Promise<VisitorPass> {
    const isAdmin = await this.estateManagementService.isEstateAdmin(userId, estateId);
    if (!isAdmin) {
      throw new ForbiddenException('Only estate administrators can check out visitors');
    }

    const pass = await this.visitorPassRepository.findOne({
      where: { id: passId, estateId },
    });

    if (!pass) {
      throw new NotFoundException(`Visitor pass with ID ${passId} not found`);
    }

    if (pass.status !== VisitorPassStatus.CHECKED_IN) {
      throw new BadRequestException('Visitor must be checked in before checking out');
    }

    pass.status = VisitorPassStatus.CHECKED_OUT;
    pass.checkedOutAt = new Date();
    pass.exitGate = gateName;

    return this.visitorPassRepository.save(pass);
  }

  /**
   * Revoke visitor pass
   */
  async revokeVisitorPass(
    passId: string,
    estateId: string,
    userId: string,
  ): Promise<VisitorPass> {
    const isAdmin = await this.estateManagementService.isEstateAdmin(userId, estateId);
    if (!isAdmin) {
      throw new ForbiddenException('Only estate administrators can revoke visitor passes');
    }

    const pass = await this.visitorPassRepository.findOne({
      where: { id: passId, estateId },
    });

    if (!pass) {
      throw new NotFoundException(`Visitor pass with ID ${passId} not found`);
    }

    pass.status = VisitorPassStatus.REVOKED;
    return this.visitorPassRepository.save(pass);
  }

  /**
   * Get visitor pass by ID
   */
  async getVisitorPass(
    passId: string,
    estateId: string,
    userId: string,
  ): Promise<VisitorPass> {
    const isAdmin = await this.estateManagementService.isEstateAdmin(userId, estateId);
    if (!isAdmin) {
      throw new ForbiddenException('Only estate administrators can view visitor passes');
    }

    const pass = await this.visitorPassRepository.findOne({
      where: { id: passId, estateId },
      relations: ['visitor', 'host', 'estate'],
    });

    if (!pass) {
      throw new NotFoundException(`Visitor pass with ID ${passId} not found`);
    }

    return pass;
  }
}




