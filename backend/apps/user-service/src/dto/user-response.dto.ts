import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';

@Exclude()
export class UserResponseDto {
  @Expose()
  @ApiProperty({ description: 'User ID' })
  id: string;

  @Expose()
  @ApiProperty({ description: 'First name' })
  firstName: string;

  @Expose()
  @ApiProperty({ description: 'Last name' })
  lastName: string;

  @Expose()
  @ApiProperty({ description: 'Full name' })
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  @Expose()
  @ApiProperty({ description: 'Email address' })
  email: string;

  @Expose()
  @ApiPropertyOptional({ description: 'Phone number' })
  phoneNumber?: string;

  @Expose()
  @ApiPropertyOptional({ description: 'Profile picture URL' })
  profilePictureUrl?: string;

  @Expose()
  @ApiPropertyOptional({ description: 'Date of birth' })
  dateOfBirth?: Date;

  @Expose()
  @ApiPropertyOptional({ description: 'Gender' })
  gender?: string;

  @Expose()
  @ApiProperty({ description: 'Verification status' })
  isVerified: boolean;

  @Expose()
  @ApiProperty({ description: 'Phone verification status' })
  phoneVerified: boolean;

  @Expose()
  @ApiProperty({ description: 'Identity verification status' })
  identityVerified: boolean;

  @Expose()
  @ApiProperty({ description: 'Address verification status' })
  addressVerified: boolean;

  @Expose()
  @ApiProperty({ description: 'Trust score (0-100)' })
  trustScore: number;

  @Expose()
  @ApiPropertyOptional({ description: 'Verification level' })
  verificationLevel?: string;

  @Expose()
  @ApiPropertyOptional({ description: 'Verification badge type' })
  verificationBadge?: string;

  @Expose()
  @ApiPropertyOptional({ description: 'Bio/description' })
  bio?: string;

  @Expose()
  @ApiPropertyOptional({ description: 'Occupation' })
  occupation?: string;

  @Expose()
  @ApiPropertyOptional({ description: 'Professional skills' })
  professionalSkills?: string;

  @Expose()
  @ApiPropertyOptional({ description: 'Cultural background' })
  culturalBackground?: string;

  @Expose()
  @ApiPropertyOptional({ description: 'Native languages' })
  nativeLanguages?: string;

  @Expose()
  @ApiProperty({ description: 'Preferred language' })
  preferredLanguage: string;

  // Location fields
  @Expose()
  @ApiPropertyOptional({ description: 'State' })
  state?: string;

  @Expose()
  @ApiPropertyOptional({ description: 'City' })
  city?: string;

  @Expose()
  @ApiPropertyOptional({ description: 'Estate' })
  estate?: string;

  @Expose()
  @ApiPropertyOptional({ description: 'Location string' })
  get locationString(): string {
    const parts = [this.estate, this.city, this.state].filter(Boolean);
    return parts.join(', ') || 'Location not set';
  }

  @Expose()
  @ApiPropertyOptional({ description: 'Landmark' })
  landmark?: string;

  @Expose()
  @ApiPropertyOptional({ description: 'Address' })
  address?: string;

  @Expose()
  @ApiProperty({ description: 'Account active status' })
  isActive: boolean;

  @Expose()
  @ApiProperty({ description: 'Member since date' })
  memberSince?: Date;

  @Expose()
  @ApiProperty({ description: 'Last login timestamp' })
  lastLoginAt?: Date;

  @Expose()
  @ApiProperty({ description: 'Account creation date' })
  createdAt: Date;

  @Expose()
  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;

  @Expose()
  @ApiPropertyOptional({ description: 'Join date formatted' })
  get joinDate(): string {
    const date = this.memberSince || this.createdAt;
    return date?.toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long',
    }) || 'Recently joined';
  }

  @Expose()
  @ApiProperty({ description: 'Profile completion percentage' })
  get profileCompleteness(): number {
    let score = 0;
    const fields = [
      this.firstName,
      this.lastName,
      this.email,
      this.phoneNumber,
      this.phoneVerified,
      this.bio,
      this.occupation,
      this.state,
      this.city,
      this.profilePictureUrl,
    ];

    fields.forEach(field => {
      if (field) score += 10;
    });

    return Math.min(score, 100);
  }
}
