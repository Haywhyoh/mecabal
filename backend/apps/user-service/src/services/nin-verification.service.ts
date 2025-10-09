import { Injectable, Logger, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NinVerification, VerificationStatus, VerificationMethod } from '@app/database';
import { VerificationAudit } from '@app/database';

export interface NinVerificationRequest {
  ninNumber: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth: string;
  gender: string;
  stateOfOrigin: string;
  lgaOfOrigin?: string;
  phoneNumber?: string;
}

export interface MockNinVerificationResponse {
  success: boolean;
  data?: {
    ninNumber: string;
    firstName: string;
    lastName: string;
    middleName?: string;
    dateOfBirth: string;
    gender: string;
    stateOfOrigin: string;
    lgaOfOrigin?: string;
    phoneNumber?: string;
    photoUrl?: string;
  };
  error?: string;
  reference: string;
}

@Injectable()
export class NinVerificationService {
  private readonly logger = new Logger(NinVerificationService.name);

  constructor(
    @InjectRepository(NinVerification)
    private readonly ninVerificationRepository: Repository<NinVerification>,
    @InjectRepository(VerificationAudit)
    private readonly verificationAuditRepository: Repository<VerificationAudit>,
  ) {}

  /**
   * Initiate NIN verification process
   */
  async initiateVerification(
    userId: string,
    request: NinVerificationRequest,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ success: boolean; message: string; verificationId?: string }> {
    try {
      // Check if user already has a verification record
      const existingVerification = await this.ninVerificationRepository.findOne({
        where: { userId },
      });

      if (existingVerification) {
        if (existingVerification.verificationStatus === VerificationStatus.VERIFIED) {
          throw new ConflictException('User already has a verified NIN');
        }
        if (existingVerification.verificationStatus === VerificationStatus.PENDING) {
          throw new ConflictException('NIN verification is already in progress');
        }
      }

      // Create audit log
      await this.createAuditLog(
        userId,
        'nin',
        'initiated',
        'success',
        null,
        { ninNumber: request.ninNumber },
        { ipAddress, userAgent },
        userId,
      );

      // Perform mock NIN verification
      const mockResponse = await this.performMockNinVerification(request);

      if (mockResponse.success) {
        // Create or update verification record
        const verificationData = {
          userId,
          ninNumber: this.encryptNinNumber(request.ninNumber),
          firstName: mockResponse.data.firstName,
          lastName: mockResponse.data.lastName,
          middleName: mockResponse.data.middleName,
          dateOfBirth: new Date(mockResponse.data.dateOfBirth),
          gender: mockResponse.data.gender,
          stateOfOrigin: mockResponse.data.stateOfOrigin,
          lgaOfOrigin: mockResponse.data.lgaOfOrigin,
          phoneNumber: mockResponse.data.phoneNumber,
          photoUrl: mockResponse.data.photoUrl,
          verificationStatus: VerificationStatus.VERIFIED,
          verificationMethod: VerificationMethod.API,
          verifiedAt: new Date(),
          apiProvider: 'mock',
          apiReference: mockResponse.reference,
          apiResponse: mockResponse,
        };

        let verification: NinVerification;
        if (existingVerification) {
          Object.assign(existingVerification, verificationData);
          verification = await this.ninVerificationRepository.save(existingVerification);
        } else {
          verification = this.ninVerificationRepository.create(verificationData);
          verification = await this.ninVerificationRepository.save(verification);
        }

        // Create success audit log
        await this.createAuditLog(
          userId,
          'nin',
          'verified',
          'success',
          null,
          { verificationId: verification.id },
          { ipAddress, userAgent },
          userId,
        );

        this.logger.log(`NIN verification successful for user ${userId}`);
        return {
          success: true,
          message: 'NIN verification completed successfully',
          verificationId: verification.id,
        };
      } else {
        // Create failure record
        const verificationData = {
          userId,
          ninNumber: this.encryptNinNumber(request.ninNumber),
          firstName: request.firstName,
          lastName: request.lastName,
          middleName: request.middleName,
          dateOfBirth: new Date(request.dateOfBirth),
          gender: request.gender,
          stateOfOrigin: request.stateOfOrigin,
          lgaOfOrigin: request.lgaOfOrigin,
          phoneNumber: request.phoneNumber,
          verificationStatus: VerificationStatus.FAILED,
          verificationMethod: VerificationMethod.API,
          apiProvider: 'mock',
          apiReference: mockResponse.reference,
          apiResponse: mockResponse,
          failureReason: mockResponse.error,
        };

        let verification: NinVerification;
        if (existingVerification) {
          Object.assign(existingVerification, verificationData);
          verification = await this.ninVerificationRepository.save(existingVerification);
        } else {
          verification = this.ninVerificationRepository.create(verificationData);
          verification = await this.ninVerificationRepository.save(verification);
        }

        // Create failure audit log
        await this.createAuditLog(
          userId,
          'nin',
          'failed',
          'failed',
          null,
          { verificationId: verification.id, error: mockResponse.error },
          { ipAddress, userAgent },
          userId,
        );

        this.logger.warn(`NIN verification failed for user ${userId}: ${mockResponse.error}`);
        return {
          success: false,
          message: mockResponse.error || 'NIN verification failed',
        };
      }
    } catch (error) {
      this.logger.error(`NIN verification error for user ${userId}:`, error);
      
      // Create error audit log
      await this.createAuditLog(
        userId,
        'nin',
        'failed',
        'failed',
        null,
        { error: error.message },
        { ipAddress, userAgent },
        userId,
      );

      throw error;
    }
  }

  /**
   * Get NIN verification status for a user
   */
  async getVerificationStatus(userId: string): Promise<{
    status: VerificationStatus;
    verifiedAt?: Date;
    verificationMethod?: VerificationMethod;
    failureReason?: string;
  }> {
    const verification = await this.ninVerificationRepository.findOne({
      where: { userId },
    });

    if (!verification) {
      return { status: VerificationStatus.PENDING };
    }

    return {
      status: verification.verificationStatus,
      verifiedAt: verification.verifiedAt,
      verificationMethod: verification.verificationMethod,
      failureReason: verification.failureReason,
    };
  }

  /**
   * Get verification details (for admin use)
   */
  async getVerificationDetails(userId: string): Promise<NinVerification | null> {
    return this.ninVerificationRepository.findOne({
      where: { userId },
    });
  }

  /**
   * Perform mock NIN verification
   * This simulates a real NIN verification API call
   */
  private async performMockNinVerification(
    request: NinVerificationRequest,
  ): Promise<MockNinVerificationResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    // Mock validation rules
    const validationErrors = this.validateNinRequest(request);
    if (validationErrors.length > 0) {
      return {
        success: false,
        error: validationErrors.join(', '),
        reference: this.generateReference(),
      };
    }

    // Mock success rate (90% success for demo)
    const isSuccess = Math.random() > 0.1;

    if (!isSuccess) {
      const errorMessages = [
        'NIN not found in database',
        'Personal details do not match NIN records',
        'NIN has been deactivated',
        'Invalid NIN format',
        'Verification service temporarily unavailable',
      ];
      const randomError = errorMessages[Math.floor(Math.random() * errorMessages.length)];
      
      return {
        success: false,
        error: randomError,
        reference: this.generateReference(),
      };
    }

    // Mock successful response
    return {
      success: true,
      data: {
        ninNumber: request.ninNumber,
        firstName: request.firstName,
        lastName: request.lastName,
        middleName: request.middleName,
        dateOfBirth: request.dateOfBirth,
        gender: request.gender,
        stateOfOrigin: request.stateOfOrigin,
        lgaOfOrigin: request.lgaOfOrigin,
        phoneNumber: request.phoneNumber,
        photoUrl: `https://mock-photos.mecabal.com/${request.ninNumber}.jpg`,
      },
      reference: this.generateReference(),
    };
  }

  /**
   * Validate NIN request data
   */
  private validateNinRequest(request: NinVerificationRequest): string[] {
    const errors: string[] = [];

    // NIN number validation
    if (!request.ninNumber || !/^\d{11}$/.test(request.ninNumber)) {
      errors.push('NIN number must be exactly 11 digits');
    }

    // Name validation
    if (!request.firstName || request.firstName.trim().length < 2) {
      errors.push('First name is required and must be at least 2 characters');
    }

    if (!request.lastName || request.lastName.trim().length < 2) {
      errors.push('Last name is required and must be at least 2 characters');
    }

    // Date of birth validation
    const dob = new Date(request.dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - dob.getFullYear();
    
    if (isNaN(dob.getTime())) {
      errors.push('Invalid date of birth format');
    } else if (age < 16 || age > 120) {
      errors.push('Age must be between 16 and 120 years');
    }

    // Gender validation
    const validGenders = ['male', 'female', 'other'];
    if (!request.gender || !validGenders.includes(request.gender.toLowerCase())) {
      errors.push('Gender must be male, female, or other');
    }

    // State validation
    const validStates = [
      'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa',
      'Benue', 'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo',
      'Ekiti', 'Enugu', 'FCT', 'Gombe', 'Imo', 'Jigawa',
      'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara',
      'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun',
      'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara'
    ];
    
    if (!request.stateOfOrigin || !validStates.includes(request.stateOfOrigin)) {
      errors.push('Invalid state of origin');
    }

    return errors;
  }

  /**
   * Encrypt NIN number for storage
   * In production, use proper encryption
   */
  private encryptNinNumber(ninNumber: string): string {
    // Simple base64 encoding for demo - use proper encryption in production
    return Buffer.from(ninNumber).toString('base64');
  }

  /**
   * Generate mock API reference
   */
  private generateReference(): string {
    return `MOCK_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create audit log entry
   */
  private async createAuditLog(
    userId: string,
    verificationType: string,
    action: string,
    status: string,
    previousValue: any,
    newValue: any,
    metadata: any,
    performedBy: string,
  ): Promise<void> {
    try {
      const auditLog = this.verificationAuditRepository.create({
        userId,
        verificationType,
        action,
        status,
        previousValue,
        newValue,
        metadata,
        performedBy,
      });

      await this.verificationAuditRepository.save(auditLog);
    } catch (error) {
      this.logger.error('Failed to create audit log:', error);
    }
  }
}
