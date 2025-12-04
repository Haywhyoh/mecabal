import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { Visitor, VisitorPass, VisitorPassStatus, SendMethod, Neighborhood, User } from '@app/database/entities';
import { EstateManagementService } from './estate-management.service';
import * as crypto from 'crypto';
import * as nodemailer from 'nodemailer';

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
  generateAccessCode?: boolean;
  sendMethod?: SendMethod;
}

@Injectable()
export class VisitorService {
  private readonly logger = new Logger(VisitorService.name);
  private transporter: nodemailer.Transporter;

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
  ) {
    // Initialize email transporter
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT),
      secure: true,
      auth: {
        user: process.env.EMAIL_HOST_USER,
        pass: process.env.EMAIL_HOST_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false,
      },
      connectionTimeout: 60000,
      greetingTimeout: 30000,
      socketTimeout: 60000,
    });
  }

  /**
   * Pre-register a visitor for an estate
   * Now allows regular users (residents) to pre-register visitors
   */
  async preRegisterVisitor(
    estateId: string,
    userId: string,
    dto: PreRegisterVisitorDto,
  ): Promise<Visitor> {
    // Verify estate exists
    const estate = await this.neighborhoodRepository.findOne({
      where: { id: estateId, type: 'ESTATE' as any },
    });

    if (!estate) {
      throw new NotFoundException(`Estate with ID ${estateId} not found`);
    }

    // Allow both admins and regular users to pre-register visitors
    // Regular users can pre-register visitors they will host

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
    // Convert date strings to Date objects if needed
    const expectedArrival = dto.expectedArrival instanceof Date 
      ? dto.expectedArrival 
      : new Date(dto.expectedArrival);
    const expiresAt = dto.expiresAt instanceof Date 
      ? dto.expiresAt 
      : new Date(dto.expiresAt);

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

    // Verify host matches requesting user (unless admin)
    const isAdmin = await this.estateManagementService.isEstateAdmin(userId, estateId);
    if (!isAdmin && dto.hostId !== userId) {
      throw new ForbiddenException('You can only create passes for yourself as host');
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
      expiresAt: expiresAt.toISOString(),
    };

    // Sign QR payload with JWT
    const qrCode = this.jwtService.sign(qrPayload, {
      secret: process.env.JWT_SECRET || 'visitor-pass-secret',
      expiresIn: Math.floor((expiresAt.getTime() - Date.now()) / 1000), // Expires when pass expires
    });

    // Generate 4-digit access code if requested
    let accessCode: string | undefined;
    if (dto.generateAccessCode) {
      accessCode = await this.generateAccessCode(estateId);
    }

    // Create visitor pass
    const pass = this.visitorPassRepository.create({
      id: passId,
      visitorId: dto.visitorId,
      hostId: dto.hostId,
      estateId,
      qrCode,
      qrPayload: JSON.stringify(qrPayload),
      accessCode,
      sendMethod: dto.sendMethod,
      status: VisitorPassStatus.PENDING,
      expectedArrival,
      expiresAt,
      guestCount: dto.guestCount || 0,
      purpose: dto.purpose,
      notes: dto.notes,
    });

    return this.visitorPassRepository.save(pass);
  }

  /**
   * Generate a unique 4-digit access code for a visitor pass
   */
  async generateAccessCode(estateId: string): Promise<string> {
    let attempts = 0;
    const maxAttempts = 100;

    while (attempts < maxAttempts) {
      // Generate random 4-digit code
      const code = Math.floor(1000 + Math.random() * 9000).toString();

      // Check if code already exists for this estate
      const existing = await this.visitorPassRepository.findOne({
        where: { accessCode: code, estateId },
      });

      if (!existing) {
        return code;
      }

      attempts++;
    }

    throw new BadRequestException('Failed to generate unique access code');
  }

  /**
   * Send visitor code via email or SMS
   */
  async sendVisitorCode(
    passId: string,
    estateId: string,
    userId: string,
    method: SendMethod,
  ): Promise<void> {
    const pass = await this.visitorPassRepository.findOne({
      where: { id: passId, estateId },
      relations: ['visitor', 'host', 'estate'],
    });

    if (!pass) {
      throw new NotFoundException(`Visitor pass with ID ${passId} not found`);
    }

    // Verify user is the host or admin
    const isAdmin = await this.estateManagementService.isEstateAdmin(userId, estateId);
    if (!isAdmin && pass.hostId !== userId) {
      throw new ForbiddenException('You can only send codes for your own visitor passes');
    }

    if (!pass.visitor.phoneNumber && !pass.visitor.email) {
      throw new BadRequestException('Visitor must have phone number or email to send code');
    }

    // Update send method
    pass.sendMethod = method;
    await this.visitorPassRepository.save(pass);

    // Send via email or SMS
    if (method === SendMethod.EMAIL && pass.visitor.email) {
      await this.sendVisitorCodeEmail(pass);
    } else if (method === SendMethod.SMS && pass.visitor.phoneNumber) {
      // TODO: Integrate with SMS service
      this.logger.warn('SMS sending not yet implemented');
    }
  }

  /**
   * Send visitor access code via email
   */
  private async sendVisitorCodeEmail(pass: VisitorPass): Promise<void> {
    try {
      const email = pass.visitor.email;
      const accessCode = pass.accessCode;
      const visitorName = pass.visitor.fullName;
      const hostName = pass.host?.firstName + ' ' + pass.host?.lastName;
      const estateName = pass.estate?.name || 'the estate';

      const subject = 'Your Visitor Access Code';
      const htmlContent = this.getVisitorEmailTemplate(
        visitorName,
        accessCode,
        hostName,
        estateName,
        pass.expectedArrival,
        pass.expiresAt,
      );

      const mailOptions = {
        from: `MeCabal Community <${process.env.EMAIL_SENDER || 'noreply@mecabal.com'}>`,
        to: email,
        subject,
        html: htmlContent,
        headers: {
          'X-MeCabal-Purpose': 'visitor-access-code',
          'X-MeCabal-Timestamp': new Date().toISOString(),
        },
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Visitor access code sent to ${email}`);
    } catch (error) {
      this.logger.error('Failed to send visitor code email:', error);
      throw new BadRequestException('Failed to send visitor access code email');
    }
  }

  /**
   * Get email template for visitor access code
   */
  private getVisitorEmailTemplate(
    visitorName: string,
    accessCode: string,
    hostName: string,
    estateName: string,
    expectedArrival: Date,
    expiresAt: Date,
  ): string {
    const arrivalDate = new Date(expectedArrival).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const expiryDate = new Date(expiresAt).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    return `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="utf-8">
          <title>MeCabal Visitor Access Code</title>
          <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
              .container { max-width: 600px; margin: 0 auto; padding: 0; }
              .header {
                  background: linear-gradient(135deg, #00A651 0%, #006B3C 100%);
                  color: white;
                  padding: 30px 20px;
                  text-align: center;
                  border-radius: 8px 8px 0 0;
              }
              .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
              .header p { margin: 10px 0 0 0; font-size: 16px; opacity: 0.9; }
              .content {
                  padding: 40px 30px;
                  background: #ffffff;
                  border: 1px solid #e0e0e0;
                  border-top: none;
              }
              .access-code {
                  font-size: 48px;
                  font-weight: bold;
                  color: #00A651;
                  text-align: center;
                  background: #f8f9fa;
                  padding: 30px 20px;
                  margin: 30px 0;
                  border-radius: 12px;
                  border: 2px solid #E8F5E8;
                  letter-spacing: 12px;
                  font-family: 'Courier New', monospace;
              }
              .info-box {
                  background: #f8f9fa;
                  border-left: 4px solid #00A651;
                  padding: 20px;
                  margin: 20px 0;
                  border-radius: 4px;
              }
              .info-row {
                  display: flex;
                  padding: 8px 0;
              }
              .info-label {
                  font-weight: 600;
                  color: #666;
                  min-width: 120px;
              }
              .info-value {
                  color: #333;
              }
              .footer {
                  text-align: center;
                  color: #666;
                  font-size: 14px;
                  margin-top: 30px;
                  padding: 20px;
                  background: #f8f9fa;
                  border-radius: 0 0 8px 8px;
              }
              .warning {
                  background: #fff3cd;
                  border: 1px solid #ffeaa7;
                  border-radius: 6px;
                  padding: 15px;
                  margin: 20px 0;
                  color: #856404;
              }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>🏠 MeCabal Visitor Pass</h1>
                  <p>Your Access Code for ${estateName}</p>
              </div>
              <div class="content">
                  <h2>Hello ${visitorName}! 👋</h2>
                  <p>You've been invited to visit <strong>${hostName}</strong> at <strong>${estateName}</strong>.</p>

                  <p style="font-size: 18px; font-weight: 600; color: #00A651; margin: 25px 0;">Your Access Code:</p>
                  <div class="access-code">${accessCode}</div>

                  <div class="info-box">
                      <div class="info-row">
                          <span class="info-label">Host:</span>
                          <span class="info-value">${hostName}</span>
                      </div>
                      <div class="info-row">
                          <span class="info-label">Location:</span>
                          <span class="info-value">${estateName}</span>
                      </div>
                      <div class="info-row">
                          <span class="info-label">Expected:</span>
                          <span class="info-value">${arrivalDate}</span>
                      </div>
                      <div class="info-row">
                          <span class="info-label">Expires:</span>
                          <span class="info-value">${expiryDate}</span>
                      </div>
                  </div>

                  <div class="warning">
                      <strong>⚠️ Important Instructions:</strong><br>
                      • Present this access code to the security guard at the entrance<br>
                      • The code is valid until the expiry date shown above<br>
                      • Keep this code secure and don't share it with others<br>
                      • If you have any issues, contact your host
                  </div>

                  <p>Have a pleasant visit! 🎉</p>
              </div>
              <div class="footer">
                  <p><strong>© 2024 MeCabal</strong> • Nigerian-owned • Community-first</p>
                  <p>Building safer communities across Nigeria</p>
              </div>
          </div>
      </body>
      </html>
    `;
  }

  /**
   * Validate 4-digit access code at entry gate
   */
  async validateAccessCode(
    code: string,
    estateId: string,
    gateName?: string,
  ): Promise<{
    valid: boolean;
    pass?: VisitorPass;
    message: string;
  }> {
    // Find pass by access code and estate
    const pass = await this.visitorPassRepository.findOne({
      where: { accessCode: code, estateId },
      relations: ['visitor', 'host', 'estate'],
    });

    if (!pass) {
      return {
        valid: false,
        message: 'Invalid access code',
      };
    }

    // Check if pass is expired
    if (new Date() > pass.expiresAt) {
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
      message: 'Access code is valid',
    };
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
   * Revoke visitor pass (allow host or admin to revoke)
   */
  async revokeVisitorPass(
    passId: string,
    estateId: string,
    userId: string,
  ): Promise<VisitorPass> {
    const pass = await this.visitorPassRepository.findOne({
      where: { id: passId, estateId },
    });

    if (!pass) {
      throw new NotFoundException(`Visitor pass with ID ${passId} not found`);
    }

    // Allow host or admin to revoke
    const isAdmin = await this.estateManagementService.isEstateAdmin(userId, estateId);
    if (!isAdmin && pass.hostId !== userId) {
      throw new ForbiddenException('You can only revoke your own visitor passes');
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
    const pass = await this.visitorPassRepository.findOne({
      where: { id: passId, estateId },
      relations: ['visitor', 'host', 'estate'],
    });

    if (!pass) {
      throw new NotFoundException(`Visitor pass with ID ${passId} not found`);
    }

    // Allow access if user is admin or the host
    const isAdmin = await this.estateManagementService.isEstateAdmin(userId, estateId);
    if (!isAdmin && pass.hostId !== userId) {
      throw new ForbiddenException('You can only view your own visitor passes');
    }

    return pass;
  }

  /**
   * Get visitor passes created by a user
   */
  async getMyVisitorPasses(
    estateId: string,
    userId: string,
  ): Promise<VisitorPass[]> {
    return this.visitorPassRepository.find({
      where: { hostId: userId, estateId },
      relations: ['visitor', 'estate'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Pre-register visitor and generate pass in one call
   */
  async preRegisterVisitorWithPass(
    estateId: string,
    userId: string,
    visitorDto: PreRegisterVisitorDto,
    passDto: Omit<GenerateVisitorPassDto, 'visitorId' | 'hostId'>,
  ): Promise<{ visitor: Visitor; pass: VisitorPass }> {
    // Pre-register visitor
    const visitor = await this.preRegisterVisitor(estateId, userId, visitorDto);

    // Convert date strings to Date objects if needed
    const normalizedPassDto: Omit<GenerateVisitorPassDto, 'visitorId' | 'hostId'> = {
      ...passDto,
      expectedArrival: passDto.expectedArrival instanceof Date 
        ? passDto.expectedArrival 
        : new Date(passDto.expectedArrival),
      expiresAt: passDto.expiresAt instanceof Date 
        ? passDto.expiresAt 
        : new Date(passDto.expiresAt),
    };

    // Generate pass
    const pass = await this.generateVisitorPass(estateId, userId, {
      ...normalizedPassDto,
      visitorId: visitor.id,
      hostId: userId,
    });

    return { visitor, pass };
  }
}





