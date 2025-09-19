import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('email_otps')
@Index(['email'])
@Index(['email', 'purpose'])
export class EmailOtp {
  @ApiProperty({ description: 'Unique identifier for the email OTP' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Email address the OTP was sent to' })
  @Column()
  email: string;

  @ApiProperty({ description: '6-digit OTP code' })
  @Column({ name: 'otp_code', length: 6 })
  otpCode: string;

  @ApiProperty({
    description: 'Purpose of OTP',
    enum: ['registration', 'login', 'password_reset'],
  })
  @Column({ length: 50 })
  purpose: string;

  @ApiProperty({ description: 'OTP expiration time' })
  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt: Date;

  @ApiProperty({ description: 'Whether OTP has been verified/used' })
  @Column({ default: false })
  verified: boolean;

  @ApiProperty({ description: 'When the OTP was verified' })
  @Column({ name: 'verified_at', type: 'timestamp', nullable: true })
  verifiedAt?: Date;

  @ApiProperty({ description: 'Number of verification attempts' })
  @Column({ default: 0 })
  attempts: number;

  @ApiProperty({ description: 'OTP creation timestamp' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Helper methods
  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  isValid(): boolean {
    return !this.verified && !this.isExpired() && this.attempts < 5;
  }

  canAttempt(): boolean {
    return this.attempts < 5 && !this.isExpired();
  }
}
