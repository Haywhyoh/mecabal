import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
  ManyToMany,
  ManyToOne,
  JoinTable,
  JoinColumn,
  Index,
  Relation,
} from 'typeorm';
// import type { Point } from 'typeorm'; // Temporarily disabled for PostGIS
import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { UserNeighborhood } from './user-neighborhood.entity';
import { Post } from './post.entity';
import { UserSession } from './user-session.entity';
import { OtpVerification } from './otp-verification.entity';
import { Role } from './role.entity';
import { Neighborhood } from './neighborhood.entity';
import { UserLanguage } from './user-language.entity';
import { UserPrivacySettings } from './user-privacy-settings.entity';
import { NigerianLanguage } from './nigerian-language.entity';
import { NigerianState } from './nigerian-state.entity';
import { CulturalBackground } from './cultural-background.entity';
import { ProfessionalCategory } from './professional-category.entity';
import { UserLocation } from './user-location.entity';
import type { UserBookmark } from './user-bookmark.entity';
import type { UserDashboardStats } from './user-dashboard-stats.entity';
import type { Listing } from './listing.entity';

@Entity('users')
@Index(['phoneNumber'], { unique: true })
@Index(['email'], { unique: true })
@Index(['email', 'authProvider'])
export class User {
  @ApiProperty({ description: 'Unique identifier for the user' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'User phone number (Nigerian format)',
    example: '+2348123456789',
  })
  @Column({ name: 'phone_number', unique: true, nullable: true })
  phoneNumber?: string;

  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @Column({ unique: true })
  email: string;

  @Exclude()
  @Column({ name: 'password_hash', nullable: true })
  passwordHash?: string;

  @ApiProperty({ description: 'User first name', example: 'John' })
  @Column({ name: 'first_name' })
  firstName: string;

  @ApiProperty({ description: 'User last name', example: 'Doe' })
  @Column({ name: 'last_name' })
  lastName: string;

  @ApiProperty({ description: 'Profile picture URL', required: false })
  @Column({ name: 'profile_picture_url', nullable: true })
  profilePictureUrl?: string;

  @ApiProperty({ description: 'Date of birth', required: false })
  @Column({ name: 'date_of_birth', type: 'date', nullable: true })
  dateOfBirth?: Date;

  @ApiProperty({
    description: 'User gender',
    enum: ['male', 'female', 'other'],
    required: false,
  })
  @Column({ length: 10, nullable: true })
  gender?: string;

  @ApiProperty({ description: 'Whether user account is verified' })
  @Column({ name: 'is_verified', default: false })
  isVerified: boolean;

  @ApiProperty({ description: 'User trust score (0-100)', example: 85 })
  @Column({ name: 'trust_score', default: 0 })
  trustScore: number;

  @ApiProperty({ description: 'Whether user account is active' })
  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @ApiProperty({ description: 'Preferred language', example: 'en' })
  @Column({ name: 'preferred_language', length: 10, default: 'en' })
  preferredLanguage: string;

  @ApiProperty({ description: 'Last login timestamp', required: false })
  @Column({ name: 'last_login_at', type: 'timestamp', nullable: true })
  lastLoginAt?: Date;

  // Location Information - Now handled by UserLocation entity
  @ApiProperty({ 
    description: 'Primary location ID',
    required: false 
  })
  @Column({ name: 'primary_location_id', nullable: true })
  primaryLocationId?: string;

  // Social and Cultural Information
  // Note: culturalBackground field moved to relations section below

  @ApiProperty({
    description: 'Native languages spoken',
    example: 'Yoruba, English',
    required: false,
  })
  @Column({ name: 'native_languages', nullable: true })
  nativeLanguages?: string;

  @ApiProperty({ description: 'User bio or description', required: false })
  @Column({ type: 'text', nullable: true })
  bio?: string;

  @ApiProperty({
    description: 'Professional skills',
    example: 'Software Development, Marketing',
    required: false,
  })
  @Column({ name: 'professional_skills', type: 'text', nullable: true })
  professionalSkills?: string;

  // Cultural Profile System - New Fields
  @ApiProperty({
    description: 'State of origin ID (from Nigerian states reference)',
    required: false,
  })
  @Column({ name: 'state_of_origin_id', nullable: true })
  stateOfOriginId?: string;

  @ApiProperty({
    description: 'Cultural background ID (from cultural backgrounds reference)',
    required: false,
  })
  @Column({ name: 'cultural_background_id', nullable: true })
  culturalBackgroundId?: string;

  @ApiProperty({
    description: 'Professional category ID (from professional categories reference)',
    required: false,
  })
  @Column({ name: 'professional_category_id', nullable: true })
  professionalCategoryId?: string;

  @ApiProperty({
    description: 'Professional title within the category',
    required: false,
  })
  @Column({ name: 'professional_title', nullable: true })
  professionalTitle?: string;

  @ApiProperty({
    description: 'Occupation or job title',
    example: 'Software Engineer',
    required: false,
  })
  @Column({ nullable: true })
  occupation?: string;

  // Verification and Trust
  @ApiProperty({ description: 'Phone verification status' })
  @Column({ name: 'phone_verified', default: false })
  phoneVerified: boolean;

  @ApiProperty({ description: 'Identity verification status (NIN, etc.)' })
  @Column({ name: 'identity_verified', default: false })
  identityVerified: boolean;

  @ApiProperty({ description: 'Address verification status' })
  @Column({ name: 'address_verified', default: false })
  addressVerified: boolean;

  @ApiProperty({
    description: 'Detected phone carrier',
    example: 'MTN',
    required: false,
  })
  @Column({ name: 'phone_carrier', nullable: true })
  phoneCarrier?: string;

  // Social Authentication
  @ApiProperty({
    description: 'Google account ID for social login',
    required: false,
  })
  @Column({ name: 'google_id', nullable: true, unique: true })
  googleId?: string;

  @ApiProperty({
    description: 'Apple account ID for social login',
    required: false,
  })
  @Column({ name: 'apple_id', nullable: true, unique: true })
  appleId?: string;

  @ApiProperty({
    description: 'Facebook account ID for social login',
    required: false,
  })
  @Column({ name: 'facebook_id', nullable: true, unique: true })
  facebookId?: string;

  @ApiProperty({
    description: 'Authentication provider used for login',
    enum: ['local', 'google', 'facebook', 'apple'],
    example: 'local',
    required: false,
  })
  @Column({ 
    name: 'auth_provider', 
    type: 'enum', 
    enum: ['local', 'google', 'facebook', 'apple'], 
    default: 'local' 
  })
  authProvider: 'local' | 'google' | 'facebook' | 'apple';

  @ApiProperty({
    description: 'Whether email is verified (automatically true for OAuth)',
    example: true,
  })
  @Column({ name: 'is_email_verified', default: false })
  isEmailVerified: boolean;

  // Community Engagement
  @ApiProperty({
    description: 'Member since date for community',
    required: false,
  })
  @Column({ name: 'member_since', type: 'timestamp', nullable: true })
  memberSince?: Date;

  @ApiProperty({
    description: 'Community verification badge type',
    required: false,
  })
  @Column({ name: 'verification_badge', nullable: true })
  verificationBadge?: string;

  @ApiProperty({ description: 'Account creation timestamp' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToMany(
    () => UserNeighborhood,
    (userNeighborhood) => userNeighborhood.user,
  )
  userNeighborhoods: UserNeighborhood[];

  @OneToMany(() => Post, (post) => post.user)
  posts: Post[];

  @OneToMany(() => UserSession, (session) => session.user)
  sessions: UserSession[];

  @OneToMany(() => OtpVerification, (otp) => otp.user)
  otpVerifications: OtpVerification[];

  @ManyToMany(() => Role, (role) => role.users)
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles: Role[];

  // Cultural Profile Relations
  @OneToMany(() => UserLanguage, (ul) => ul.user)
  userLanguages?: UserLanguage[];

  @OneToOne(() => UserPrivacySettings, (settings) => settings.user)
  privacySettings?: UserPrivacySettings;

  // Cultural Profile Relations
  @ManyToOne(() => NigerianState, { nullable: true })
  @JoinColumn({ name: 'state_of_origin_id' })
  stateOfOrigin?: NigerianState;

  @ManyToOne(() => CulturalBackground, { nullable: true })
  @JoinColumn({ name: 'cultural_background_id' })
  culturalBackground?: CulturalBackground;

  @ManyToOne(() => ProfessionalCategory, { nullable: true })
  @JoinColumn({ name: 'professional_category_id' })
  professionalCategory?: ProfessionalCategory;

  // Location relationships
  @OneToMany(() => UserLocation, (userLocation) => userLocation.user)
  userLocations?: UserLocation[];

  @OneToOne(() => UserLocation, { nullable: true })
  @JoinColumn({ name: 'primary_location_id' })
  primaryLocation?: UserLocation;

  // Unidirectional relations - no inverse side to avoid circular dependencies
  // Relations are defined only in the child entities (UserBookmark, UserDashboardStats)

  // Virtual properties
  @ApiProperty({ description: 'Full name of the user' })
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  // Neighborhood helper methods
  get neighborhoods(): Neighborhood[] {
    return this.userNeighborhoods?.map((rel) => rel.neighborhood) || [];
  }

  get primaryNeighborhood(): Neighborhood | null {
    const primaryRelation = this.userNeighborhoods?.find(
      (rel) => rel.isPrimary,
    );
    return primaryRelation?.neighborhood || null;
  }

  get neighborhoodNames(): string[] {
    return this.neighborhoods.map((neighborhood) => neighborhood.name);
  }

  get primaryNeighborhoodName(): string | null {
    return this.primaryNeighborhood?.name || null;
  }

  // Helper methods
  toJSON() {
    const { passwordHash: _passwordHash, ...result } = this;
    return result;
  }

  hasRole(roleName: string): boolean {
    return this.roles?.some((role) => role.name === roleName) || false;
  }

  hasAnyRole(roleNames: string[]): boolean {
    return roleNames.some((roleName) => this.hasRole(roleName));
  }

  hasPermission(permission: string): boolean {
    return this.roles?.some((role) => role.hasPermission(permission)) || false;
  }

  hasAnyPermission(permissions: string[]): boolean {
    return permissions.some((permission) => this.hasPermission(permission));
  }

  getRoleNames(): string[] {
    return this.roles?.map((role) => role.name) || [];
  }

  getAllPermissions(): string[] {
    const permissions = new Set<string>();
    this.roles?.forEach((role) => {
      role.permissions.forEach((permission) => permissions.add(permission));
    });
    return Array.from(permissions);
  }

  // Location and verification helpers
  getLocationString(): string {
    // Use primary location if available
    if (this.primaryLocation) {
      return this.primaryLocation.neighborhood?.name || 'Location not set';
    }

    // Fallback to neighborhoods for backward compatibility
    if (this.primaryNeighborhood) {
      return this.primaryNeighborhood.name;
    }

    return 'Location not set';
  }

  getDetailedLocationString(): string {
    // Use primary location if available
    if (this.primaryLocation) {
      const location = this.primaryLocation;
      const parts = [
        location.neighborhood?.name,
        location.cityTown,
        location.lga?.name,
        location.state?.name
      ].filter(Boolean);
      return parts.join(', ') || 'Location not set';
    }

    // Fallback to neighborhoods for backward compatibility
    if (this.primaryNeighborhood) {
      const neighborhood = this.primaryNeighborhood;
      return `${neighborhood.name}, ${neighborhood.lga?.name || 'Unknown LGA'}, ${neighborhood.lga?.state?.name || 'Unknown State'}`;
    }

    return 'Location not set';
  }

  getVerificationLevel(): 'unverified' | 'phone' | 'identity' | 'full' {
    if (this.phoneVerified && this.identityVerified && this.addressVerified) {
      return 'full';
    }
    if (this.identityVerified) {
      return 'identity';
    }
    if (this.phoneVerified) {
      return 'phone';
    }
    return 'unverified';
  }

  getVerificationBadgeText(): string {
    switch (this.getVerificationLevel()) {
      case 'full':
        return 'Verified Estate Resident';
      case 'identity':
        return 'Identity Verified';
      case 'phone':
        return 'Phone Verified';
      default:
        return 'Unverified';
    }
  }

  hasSocialAuth(): boolean {
    return !!(this.googleId || this.appleId || this.facebookId);
  }

  getSocialProviders(): string[] {
    const providers = [];
    if (this.googleId) providers.push('google');
    if (this.appleId) providers.push('apple');
    if (this.facebookId) providers.push('facebook');
    return providers;
  }

  isProfileComplete(): boolean {
    return !!(
      this.firstName &&
      this.lastName &&
      this.email &&
      this.phoneNumber &&
      this.phoneVerified &&
      (this.primaryLocation || this.primaryNeighborhood) // Use new location system or fallback to neighborhoods
    );
  }

  getJoinDate(): string {
    const date = this.memberSince || this.createdAt;
    return date.toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long',
    });
  }
}
