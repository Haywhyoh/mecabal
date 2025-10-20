import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserLocation, VerificationStatus } from '@app/database/entities';
import { 
  PhotoVerificationDto, 
  DocumentVerificationDto, 
  SmsVerificationDto,
  AdminVerificationDto 
} from '../dto/verification.dto';

export interface VerificationRequest {
  id: string;
  userId: string;
  locationId: string;
  type: 'PHOTO' | 'DOCUMENT' | 'SMS' | 'ADMIN';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  data: any; // Verification-specific data
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  reason?: string;
}

@Injectable()
export class LocationVerificationService {
  constructor(
    @InjectRepository(UserLocation)
    private readonly userLocationRepository: Repository<UserLocation>,
  ) {}

  /**
   * Photo verification - User at location with landmark
   */
  async submitPhotoVerification(
    userId: string,
    locationId: string,
    photoVerificationDto: PhotoVerificationDto
  ): Promise<VerificationRequest> {
    const userLocation = await this.userLocationRepository.findOne({
      where: { id: locationId, userId },
    });

    if (!userLocation) {
      throw new NotFoundException('User location not found');
    }

    // In a real implementation, this would save to a verification_requests table
    const verificationRequest: VerificationRequest = {
      id: `photo_${Date.now()}`,
      userId,
      locationId,
      type: 'PHOTO',
      status: 'PENDING',
      data: {
        photoUrl: photoVerificationDto.photoUrl,
        landmarkId: photoVerificationDto.landmarkId,
        coordinates: photoVerificationDto.coordinates,
        timestamp: photoVerificationDto.timestamp,
        description: photoVerificationDto.description,
      },
      submittedAt: new Date(),
    };

    // TODO: Save to database and notify admins
    console.log('Photo verification submitted:', verificationRequest);

    return verificationRequest;
  }

  /**
   * Document verification - Address document upload
   */
  async submitDocumentVerification(
    userId: string,
    locationId: string,
    documentVerificationDto: DocumentVerificationDto
  ): Promise<VerificationRequest> {
    const userLocation = await this.userLocationRepository.findOne({
      where: { id: locationId, userId },
    });

    if (!userLocation) {
      throw new NotFoundException('User location not found');
    }

    const verificationRequest: VerificationRequest = {
      id: `doc_${Date.now()}`,
      userId,
      locationId,
      type: 'DOCUMENT',
      status: 'PENDING',
      data: {
        documentUrl: documentVerificationDto.documentUrl,
        documentType: documentVerificationDto.documentType,
        address: documentVerificationDto.address,
        issueDate: documentVerificationDto.issueDate,
        expiryDate: documentVerificationDto.expiryDate,
      },
      submittedAt: new Date(),
    };

    // TODO: Save to database and notify admins
    console.log('Document verification submitted:', verificationRequest);

    return verificationRequest;
  }

  /**
   * SMS verification with location check
   */
  async submitSmsVerification(
    userId: string,
    locationId: string,
    smsVerificationDto: SmsVerificationDto
  ): Promise<VerificationRequest> {
    const userLocation = await this.userLocationRepository.findOne({
      where: { id: locationId, userId },
    });

    if (!userLocation) {
      throw new NotFoundException('User location not found');
    }

    // Verify SMS code (this would integrate with SMS service)
    const isValidCode = await this.verifySmsCode(
      smsVerificationDto.phoneNumber,
      smsVerificationDto.code
    );

    if (!isValidCode) {
      throw new BadRequestException('Invalid SMS verification code');
    }

    // Check if user is actually at the location (GPS verification)
    const isAtLocation = await this.verifyLocationProximity(
      smsVerificationDto.coordinates,
      userLocation.coordinates
    );

    if (!isAtLocation) {
      throw new BadRequestException('Location verification failed - not at specified location');
    }

    const verificationRequest: VerificationRequest = {
      id: `sms_${Date.now()}`,
      userId,
      locationId,
      type: 'SMS',
      status: 'APPROVED', // SMS verification is auto-approved if valid
      data: {
        phoneNumber: smsVerificationDto.phoneNumber,
        coordinates: smsVerificationDto.coordinates,
        timestamp: new Date(),
      },
      submittedAt: new Date(),
      reviewedAt: new Date(),
    };

    // Auto-approve SMS verification
    await this.approveVerification(verificationRequest.id, 'SMS verification successful');

    return verificationRequest;
  }

  /**
   * Estate admin verification for gated communities
   */
  async submitAdminVerification(
    userId: string,
    locationId: string,
    adminVerificationDto: AdminVerificationDto
  ): Promise<VerificationRequest> {
    const userLocation = await this.userLocationRepository.findOne({
      where: { id: locationId, userId },
      relations: ['neighborhood'],
    });

    if (!userLocation) {
      throw new NotFoundException('User location not found');
    }

    // Check if the neighborhood requires admin verification
    if (!userLocation.neighborhood?.requiresVerification) {
      throw new BadRequestException('This neighborhood does not require admin verification');
    }

    const verificationRequest: VerificationRequest = {
      id: `admin_${Date.now()}`,
      userId,
      locationId,
      type: 'ADMIN',
      status: 'PENDING',
      data: {
        estateId: adminVerificationDto.estateId,
        address: adminVerificationDto.address,
        moveInDate: adminVerificationDto.moveInDate,
        phone: adminVerificationDto.phone,
        message: adminVerificationDto.message,
        houseNumber: adminVerificationDto.houseNumber,
        blockNumber: adminVerificationDto.blockNumber,
      },
      submittedAt: new Date(),
    };

    // TODO: Notify estate admin
    console.log('Admin verification submitted:', verificationRequest);

    return verificationRequest;
  }

  /**
   * Approve verification request
   */
  async approveVerification(
    verificationId: string,
    reason?: string,
    reviewedBy?: string
  ): Promise<void> {
    // In a real implementation, this would update the verification_requests table
    console.log(`Verification ${verificationId} approved by ${reviewedBy}: ${reason}`);

    // Update user location verification status
    // This would be done by finding the associated location and updating it
    // await this.userLocationRepository.update(
    //   { id: locationId },
    //   { verificationStatus: VerificationStatus.VERIFIED }
    // );
  }

  /**
   * Reject verification request
   */
  async rejectVerification(
    verificationId: string,
    reason: string,
    reviewedBy?: string
  ): Promise<void> {
    // In a real implementation, this would update the verification_requests table
    console.log(`Verification ${verificationId} rejected by ${reviewedBy}: ${reason}`);
  }

  /**
   * Get verification requests for admin review
   */
  async getPendingVerifications(
    adminUserId?: string,
    type?: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<VerificationRequest[]> {
    // In a real implementation, this would query the verification_requests table
    // For now, return empty array
    return [];
  }

  /**
   * Get user's verification history
   */
  async getUserVerificationHistory(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<VerificationRequest[]> {
    // In a real implementation, this would query the verification_requests table
    // For now, return empty array
    return [];
  }

  /**
   * Get verification statistics
   */
  async getVerificationStats(): Promise<{
    totalRequests: number;
    pendingRequests: number;
    approvedRequests: number;
    rejectedRequests: number;
    byType: Record<string, number>;
  }> {
    // In a real implementation, this would query the verification_requests table
    return {
      totalRequests: 0,
      pendingRequests: 0,
      approvedRequests: 0,
      rejectedRequests: 0,
      byType: {},
    };
  }

  /**
   * Verify SMS code (placeholder implementation)
   */
  private async verifySmsCode(phoneNumber: string, code: string): Promise<boolean> {
    // In a real implementation, this would verify against SMS service
    // For now, accept any 6-digit code
    return /^\d{6}$/.test(code);
  }

  /**
   * Verify location proximity (placeholder implementation)
   */
  private async verifyLocationProximity(
    userCoordinates: { latitude: number; longitude: number },
    locationCoordinates: any,
    maxDistance: number = 100 // 100 meters
  ): Promise<boolean> {
    if (!locationCoordinates?.coordinates) {
      return false;
    }

    const [lng, lat] = locationCoordinates.coordinates;
    const distance = this.calculateDistance(
      userCoordinates.latitude,
      userCoordinates.longitude,
      lat,
      lng
    );

    return distance <= maxDistance;
  }

  /**
   * Calculate distance between two coordinates
   */
  private calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Send SMS verification code
   */
  async sendSmsVerificationCode(phoneNumber: string): Promise<{ success: boolean; messageId?: string }> {
    // In a real implementation, this would integrate with SMS service
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    console.log(`SMS verification code for ${phoneNumber}: ${code}`);
    
    // TODO: Store code in database with expiry time
    // TODO: Send actual SMS
    
    return {
      success: true,
      messageId: `sms_${Date.now()}`,
    };
  }

  /**
   * Get verification requirements for a location
   */
  async getVerificationRequirements(locationId: string): Promise<{
    requiresVerification: boolean;
    allowedMethods: string[];
    requiredDocuments: string[];
    maxDistance: number;
  }> {
    const userLocation = await this.userLocationRepository.findOne({
      where: { id: locationId },
      relations: ['neighborhood'],
    });

    if (!userLocation) {
      throw new NotFoundException('Location not found');
    }

    const neighborhood = userLocation.neighborhood;
    
    return {
      requiresVerification: neighborhood?.requiresVerification || false,
      allowedMethods: neighborhood?.isGated 
        ? ['PHOTO', 'DOCUMENT', 'ADMIN'] 
        : ['PHOTO', 'DOCUMENT', 'SMS'],
      requiredDocuments: ['utility_bill', 'bank_statement', 'government_id'],
      maxDistance: 100, // meters
    };
  }
}
