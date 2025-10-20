import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Neighborhood, User } from '@app/database/entities';
import { EstateVerificationDto } from '../dto/neighborhood.dto';

export interface EstateVerificationRequest {
  id: string;
  userId: string;
  estateId: string;
  address: string;
  moveInDate: string;
  phone: string;
  message?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class EstateManagementService {
  constructor(
    @InjectRepository(Neighborhood)
    private readonly neighborhoodRepository: Repository<Neighborhood>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // use the detailed version defined later; remove early duplicate

  // use the detailed version defined later; remove early duplicate

  // use the detailed version defined later; remove early duplicate

  // use the detailed version defined later; remove early duplicate

  async getEstateVerificationRequests(estateId: string): Promise<EstateVerificationRequest[]> {
    // In a real implementation, this would query the verification requests table
    // For now, we'll return an empty array
    return [];
  }

  async approveEstateVerification(
    requestId: string,
    approved: boolean,
    reason?: string
  ): Promise<void> {
    // In a real implementation, this would update the verification request status
    // and potentially create a user-location relationship
    console.log(`Estate verification ${requestId} ${approved ? 'approved' : 'rejected'}: ${reason}`);
  }

  async getEstateStats(estateId: string): Promise<{
    totalMembers: number;
    pendingVerifications: number;
    approvedVerifications: number;
    rejectedVerifications: number;
  }> {
    // In a real implementation, this would query the database for actual stats
    return {
      totalMembers: 0,
      pendingVerifications: 0,
      approvedVerifications: 0,
      rejectedVerifications: 0,
    };
  }

  async isEstateAdmin(userId: string, estateId: string): Promise<boolean> {
    const estate = await this.neighborhoodRepository.findOne({
      where: { id: estateId, adminUserId: userId },
    });

    return !!estate;
  }

  async getEstatesByAdmin(userId: string): Promise<Neighborhood[]> {
    return this.neighborhoodRepository.find({
      where: { adminUserId: userId, type: 'ESTATE' as any },
      relations: ['ward', 'ward.lga', 'ward.lga.state'],
      order: { name: 'ASC' },
    });
  }

  /**
   * Create gated estate/neighborhood
   */
  async createEstate(dto: {
    name: string;
    wardId: string;
    isGated: boolean;
    requiresVerification: boolean;
    adminUserId?: string;
    description?: string;
  }): Promise<Neighborhood> {
    const estate = this.neighborhoodRepository.create({
      ...dto,
      type: 'ESTATE' as any,
    });

    return this.neighborhoodRepository.save(estate);
  }

  /**
   * Verify estate resident
   */
  async verifyEstateResident(
    userId: string,
    estateId: string,
    verificationData: {
      address: string;
      moveInDate: string;
      phone: string;
      message?: string;
    }
  ): Promise<EstateVerificationRequest> {
    // In a real implementation, this would create a verification request record
    const verificationRequest: EstateVerificationRequest = {
      id: `req_${Date.now()}`,
      userId,
      estateId,
      ...verificationData,
      status: 'PENDING',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // TODO: Save to database and notify estate admin
    return verificationRequest;
  }

  /**
   * Assign estate admin
   */
  async assignEstateAdmin(estateId: string, userId: string): Promise<Neighborhood> {
    const estate = await this.neighborhoodRepository.findOne({
      where: { id: estateId },
    });

    if (!estate) {
      throw new Error(`Estate with ID ${estateId} not found`);
    }

    estate.adminUserId = userId;
    return this.neighborhoodRepository.save(estate);
  }

  /**
   * Get estate members
   */
  async getEstateMembers(estateId: string): Promise<User[]> {
    // In a real implementation, this would query a user-location relationship table
    return [];
  }
}
