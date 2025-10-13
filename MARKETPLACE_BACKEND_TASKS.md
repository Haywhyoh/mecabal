# Marketplace Backend Enhancement Tasks

## Overview
This document outlines the backend tasks required to enhance the marketplace functionality, including API improvements, data model enhancements, and support for different listing types (goods, services, jobs, properties).

## Current Backend Analysis

### Existing Infrastructure
- **Database**: PostgreSQL with TypeORM
- **API Gateway**: NestJS-based microservices architecture
- **Entities**: Listing, ListingCategory, ListingMedia, ListingSave
- **Services**: Marketplace service (needs implementation)

### Current Data Model Gaps
1. **Service Listings**: Missing service-specific fields
2. **Job Listings**: No job-specific data structure
3. **Property Listings**: Limited property-specific fields
4. **Dynamic Categories**: Static category system
5. **Advanced Search**: Limited search capabilities

## Backend Tasks

### Phase 1: Data Model Enhancements (Week 1-2)

#### Task 1.1: Enhance Listing Entity
**File**: `backend/libs/database/src/entities/listing.entity.ts`
**Priority**: High
**Estimated Time**: 8 hours

**Requirements**:
- Add service-specific fields
- Add job-specific fields
- Enhance property-specific fields
- Add dynamic category support
- Improve validation

**New Fields to Add**:
```typescript
// Service-specific fields
@Column({ name: 'service_type', length: 50, nullable: true })
serviceType?: string; // 'offering' | 'request'

@Column({ name: 'availability_schedule', type: 'jsonb', nullable: true })
availabilitySchedule?: {
  days: string[];
  startTime: string;
  endTime: string;
  timezone: string;
};

@Column({ name: 'service_radius', type: 'int', nullable: true })
serviceRadius?: number; // in kilometers

@Column({ name: 'professional_credentials', type: 'jsonb', nullable: true })
professionalCredentials?: {
  licenses: string[];
  certifications: string[];
  experience: number; // years
  insurance: boolean;
};

@Column({ name: 'pricing_model', length: 20, nullable: true })
pricingModel?: string; // 'hourly' | 'project' | 'fixed' | 'negotiable'

@Column({ name: 'response_time', type: 'int', nullable: true })
responseTime?: number; // in hours

// Job-specific fields
@Column({ name: 'employment_type', length: 20, nullable: true })
employmentType?: string; // 'full_time' | 'part_time' | 'contract' | 'freelance'

@Column({ name: 'salary_min', type: 'decimal', precision: 12, scale: 2, nullable: true })
salaryMin?: number;

@Column({ name: 'salary_max', type: 'decimal', precision: 12, scale: 2, nullable: true })
salaryMax?: number;

@Column({ name: 'application_deadline', type: 'timestamp', nullable: true })
applicationDeadline?: Date;

@Column({ name: 'required_skills', type: 'jsonb', nullable: true })
requiredSkills?: string[];

@Column({ name: 'work_location', length: 20, nullable: true })
workLocation?: string; // 'remote' | 'on_site' | 'hybrid'

@Column({ name: 'company_info', type: 'jsonb', nullable: true })
companyInfo?: {
  name: string;
  size: string;
  industry: string;
  website?: string;
};

// Enhanced property fields
@Column({ name: 'property_amenities', type: 'jsonb', nullable: true })
propertyAmenities?: string[];

@Column({ name: 'utilities_included', type: 'jsonb', nullable: true })
utilitiesIncluded?: string[];

@Column({ name: 'pet_policy', length: 20, nullable: true })
petPolicy?: string; // 'allowed' | 'not_allowed' | 'case_by_case'

@Column({ name: 'parking_spaces', type: 'int', nullable: true })
parkingSpaces?: number;

@Column({ name: 'security_features', type: 'jsonb', nullable: true })
securityFeatures?: string[];

@Column({ name: 'property_size', type: 'decimal', precision: 10, scale: 2, nullable: true })
propertySize?: number; // in square meters

@Column({ name: 'land_size', type: 'decimal', precision: 10, scale: 2, nullable: true })
landSize?: number; // in square meters

// Enhanced location fields
@Column({ name: 'neighborhood_id', length: 36, nullable: true })
neighborhoodId?: string;

@Column({ name: 'estate_id', length: 36, nullable: true })
estateId?: string;

@Column({ name: 'city', length: 100, nullable: true })
city?: string;

@Column({ name: 'state', length: 50, nullable: true })
state?: string;

// Enhanced status and metadata
@Column({ name: 'featured', type: 'boolean', default: false })
featured: boolean;

@Column({ name: 'boosted', type: 'boolean', default: false })
boosted: boolean;

@Column({ name: 'verification_status', length: 20, default: 'pending' })
verificationStatus: string; // 'pending' | 'verified' | 'rejected'

@Column({ name: 'contact_preferences', type: 'jsonb', nullable: true })
contactPreferences?: {
  allowCalls: boolean;
  allowMessages: boolean;
  allowWhatsApp: boolean;
  preferredTime: string;
};
```

**Acceptance Criteria**:
- [ ] All new fields added to entity
- [ ] Proper validation decorators added
- [ ] Database migration created
- [ ] Entity relationships updated
- [ ] TypeScript types updated

#### Task 1.2: Enhance Business Entity for Services
**Priority**: High
**Estimated Time**: 6 hours

**Requirements**:
- Enhance existing Business entity to support services
- Create ServiceInquiry entity for business inquiries
- Create BusinessReview entity for business reviews
- Add proper relationships

**Enhanced Business Entity**:
```typescript
// Add to existing Business entity
@Column({ name: 'services_offered', type: 'jsonb', nullable: true })
servicesOffered: {
  category: string;
  subcategory: string;
  description: string;
  pricing: {
    model: 'hourly' | 'project' | 'fixed' | 'negotiable';
    rate?: number;
  };
  availability: {
    days: string[];
    startTime: string;
    endTime: string;
  };
}[];

@Column({ name: 'service_areas', type: 'jsonb' })
serviceAreas: {
  type: 'estate' | 'neighborhood' | 'city' | 'state';
  radius?: number;
  specificAreas?: string[];
};

@Column({ name: 'response_time', type: 'int', default: 24 })
responseTime: number; // in hours

@Column({ name: 'contact_preferences', type: 'jsonb' })
contactPreferences: {
  allowCalls: boolean;
  allowMessages: boolean;
  allowWhatsApp: boolean;
  preferredTime: string;
};
```

**ServiceInquiry Entity**:
```typescript
@Entity('service_inquiries')
export class ServiceInquiry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'business_id' })
  businessId: string;

  @Column({ name: 'customer_id' })
  customerId: string;

  @Column({ name: 'service_type', length: 100 })
  serviceType: string;

  @Column({ name: 'description', type: 'text' })
  description: string;

  @Column({ name: 'urgency', length: 20, default: 'normal' })
  urgency: string; // 'low' | 'normal' | 'high' | 'urgent'

  @Column({ name: 'budget_min', type: 'decimal', precision: 12, scale: 2, nullable: true })
  budgetMin?: number;

  @Column({ name: 'budget_max', type: 'decimal', precision: 12, scale: 2, nullable: true })
  budgetMax?: number;

  @Column({ name: 'preferred_contact', length: 20 })
  preferredContact: string; // 'call' | 'message' | 'whatsapp'

  @Column({ name: 'status', length: 20, default: 'pending' })
  status: string; // 'pending' | 'responded' | 'completed' | 'cancelled'

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne('Business')
  @JoinColumn({ name: 'business_id' })
  business: Business;

  @ManyToOne('User')
  @JoinColumn({ name: 'customer_id' })
  customer: User;
}
```

**Acceptance Criteria**:
- [ ] Business entity enhanced with service fields
- [ ] ServiceInquiry entity created
- [ ] BusinessReview entity created
- [ ] Proper relationships established
- [ ] Database migrations created

#### Task 1.3: Enhance Category System
**File**: `backend/libs/database/src/entities/listing-category.entity.ts`
**Priority**: High
**Estimated Time**: 4 hours

**Requirements**:
- Add dynamic field definitions
- Add subcategories support
- Add category-specific validation rules
- Add category icons and colors

**Enhancements**:
```typescript
@Column({ name: 'parent_id', type: 'int', nullable: true })
parentId?: number;

@Column({ name: 'field_definitions', type: 'jsonb', nullable: true })
fieldDefinitions?: {
  required: string[];
  optional: string[];
  validation: Record<string, any>;
};

@Column({ name: 'search_keywords', type: 'jsonb', nullable: true })
searchKeywords?: string[];

@Column({ name: 'is_featured', type: 'boolean', default: false })
isFeatured: boolean;

@Column({ name: 'sort_order', type: 'int', default: 0 })
sortOrder: number;

@OneToMany(() => ListingCategory, category => category.parent)
children: ListingCategory[];

@ManyToOne(() => ListingCategory, category => category.children)
@JoinColumn({ name: 'parent_id' })
parent: ListingCategory;
```

**Acceptance Criteria**:
- [ ] Subcategories support added
- [ ] Dynamic field definitions
- [ ] Category-specific validation
- [ ] Search keywords support
- [ ] Hierarchical category structure

### Phase 2: API Enhancements (Week 3-4)

#### Task 2.1: Implement Marketplace Service
**File**: `backend/apps/marketplace-service/src/`
**Priority**: High
**Estimated Time**: 16 hours

**Requirements**:
- Create complete marketplace service
- Implement all CRUD operations
- Add advanced search functionality
- Add filtering and sorting
- Add pagination support

**Service Structure**:
```
marketplace-service/
├── src/
│   ├── controllers/
│   │   ├── listings.controller.ts
│   │   ├── categories.controller.ts
│   │   └── search.controller.ts
│   ├── services/
│   │   ├── listings.service.ts
│   │   ├── categories.service.ts
│   │   ├── search.service.ts
│   │   └── analytics.service.ts
│   ├── dto/
│   │   ├── create-listing.dto.ts
│   │   ├── update-listing.dto.ts
│   │   ├── search-listing.dto.ts
│   │   └── listing-response.dto.ts
│   ├── guards/
│   │   └── listing-ownership.guard.ts
│   └── marketplace.module.ts
```

**Key Features**:
- CRUD operations for listings
- Advanced search with filters
- Category management
- Analytics and reporting
- Image/media management
- Location-based search

**Acceptance Criteria**:
- [ ] Complete marketplace service implemented
- [ ] All CRUD operations working
- [ ] Advanced search functionality
- [ ] Proper error handling
- [ ] API documentation generated

#### Task 2.2: Implement Advanced Search API
**Priority**: High
**Estimated Time**: 12 hours

**Requirements**:
- Full-text search across listings
- Filter by multiple criteria
- Sort by relevance, price, date
- Location-based search
- Category-specific search

**Search Features**:
```typescript
export class SearchListingsDto {
  @IsOptional()
  @IsString()
  query?: string;

  @IsOptional()
  @IsEnum(['property', 'item', 'service', 'job'])
  listingType?: string;

  @IsOptional()
  @IsInt()
  categoryId?: number;

  @IsOptional()
  @IsNumber()
  minPrice?: number;

  @IsOptional()
  @IsNumber()
  maxPrice?: number;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsNumber()
  radius?: number;

  @IsOptional()
  @IsEnum(['createdAt', 'price', 'viewsCount', 'relevance'])
  sortBy?: string;

  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
```

**Acceptance Criteria**:
- [ ] Full-text search implemented
- [ ] Multiple filter criteria
- [ ] Sorting options
- [ ] Location-based search
- [ ] Pagination support

#### Task 2.3: Implement Business-Centric APIs
**Priority**: High
**Estimated Time**: 10 hours

**Requirements**:
- Business search and discovery
- Service inquiry system
- Business review system
- Business profile management
- Service area management

**APIs to Implement**:
- `GET /businesses` - Search businesses by category and location
- `GET /businesses/:id` - Get business profile with services
- `POST /businesses/inquiries` - Create service inquiry
- `GET /businesses/inquiries` - List business inquiries
- `POST /businesses/reviews` - Create business review
- `GET /businesses/reviews` - List business reviews
- `PUT /businesses/:id/services` - Update business services

**Acceptance Criteria**:
- [ ] Business search APIs
- [ ] Service inquiry system APIs
- [ ] Business review APIs
- [ ] Business profile management
- [ ] Service area management

#### Task 2.4: Implement Job-Specific APIs
**Priority**: High
**Estimated Time**: 8 hours

**Requirements**:
- Job posting management
- Application system
- Job matching algorithm
- Job analytics

**APIs to Implement**:
- `POST /jobs` - Create job posting
- `GET /jobs` - List job postings
- `POST /jobs/applications` - Apply for job
- `GET /jobs/applications` - List applications
- `GET /jobs/matches` - Get job matches
- `PUT /jobs/:id/status` - Update job status

**Acceptance Criteria**:
- [ ] Job posting APIs
- [ ] Application system
- [ ] Job matching algorithm
- [ ] Job analytics
- [ ] Status management

### Phase 3: Data Management (Week 5-6)

#### Task 3.1: Create Database Migrations
**Priority**: High
**Estimated Time**: 6 hours

**Requirements**:
- Create migration for enhanced listing entity
- Create migration for new entities
- Add proper indexes
- Add foreign key constraints
- Add data validation

**Migration Files**:
- `AddEnhancedListingFields.ts`
- `CreateServiceProviderEntity.ts`
- `CreateServiceReviewEntity.ts`
- `CreateServiceBookingEntity.ts`
- `AddCategoryHierarchy.ts`

**Acceptance Criteria**:
- [ ] All migrations created
- [ ] Proper indexes added
- [ ] Foreign key constraints
- [ ] Data validation rules
- [ ] Migration rollback support

#### Task 3.2: Implement Data Seeding
**Priority**: Medium
**Estimated Time**: 4 hours

**Requirements**:
- Seed listing categories
- Seed service categories
- Seed job categories
- Seed property categories
- Add sample data

**Seed Data**:
- Complete category hierarchy
- Service provider types
- Job categories
- Property types
- Sample listings

**Acceptance Criteria**:
- [ ] Category data seeded
- [ ] Sample data created
- [ ] Data validation
- [ ] Seeding scripts
- [ ] Data cleanup scripts

#### Task 3.3: Implement Data Validation
**Priority**: High
**Estimated Time**: 6 hours

**Requirements**:
- Add entity validation
- Add DTO validation
- Add business rule validation
- Add data integrity checks
- Add custom validators

**Validation Rules**:
- Price validation (positive numbers)
- Date validation (future dates for deadlines)
- Location validation (valid coordinates)
- Category validation (valid category IDs)
- User validation (valid user IDs)

**Acceptance Criteria**:
- [ ] Entity validation added
- [ ] DTO validation added
- [ ] Business rules implemented
- [ ] Data integrity checks
- [ ] Custom validators

### Phase 4: Performance and Security (Week 7-8)

#### Task 4.1: Implement Caching
**Priority**: Medium
**Estimated Time**: 8 hours

**Requirements**:
- Redis caching for listings
- Cache invalidation strategies
- Query result caching
- Category caching
- Search result caching

**Caching Strategy**:
- List listings (5 minutes)
- Category data (1 hour)
- Search results (2 minutes)
- User listings (10 minutes)
- Popular listings (30 minutes)

**Acceptance Criteria**:
- [ ] Redis integration
- [ ] Cache strategies implemented
- [ ] Cache invalidation
- [ ] Performance monitoring
- [ ] Cache statistics

#### Task 4.2: Implement Rate Limiting
**Priority**: High
**Estimated Time**: 4 hours

**Requirements**:
- API rate limiting
- User-specific limits
- IP-based limits
- Endpoint-specific limits
- Abuse prevention

**Rate Limits**:
- General API: 100 requests/minute
- Search API: 50 requests/minute
- Create listing: 10 requests/hour
- Upload media: 20 requests/hour

**Acceptance Criteria**:
- [ ] Rate limiting implemented
- [ ] User-specific limits
- [ ] IP-based limits
- [ ] Abuse prevention
- [ ] Rate limit headers

#### Task 4.3: Implement Security Measures
**Priority**: High
**Estimated Time**: 6 hours

**Requirements**:
- Input sanitization
- SQL injection prevention
- XSS prevention
- CSRF protection
- Data encryption

**Security Features**:
- Input validation and sanitization
- Parameterized queries
- Content Security Policy
- CSRF tokens
- Data encryption at rest

**Acceptance Criteria**:
- [ ] Input sanitization
- [ ] SQL injection prevention
- [ ] XSS prevention
- [ ] CSRF protection
- [ ] Data encryption

### Phase 5: Analytics and Monitoring (Week 9-10)

#### Task 5.1: Implement Analytics
**Priority**: Medium
**Estimated Time**: 8 hours

**Requirements**:
- Listing view analytics
- Search analytics
- User behavior tracking
- Performance metrics
- Business intelligence

**Analytics Features**:
- Listing performance metrics
- Search query analytics
- User engagement tracking
- Conversion tracking
- Revenue analytics

**Acceptance Criteria**:
- [ ] Analytics collection
- [ ] Performance metrics
- [ ] User behavior tracking
- [ ] Business intelligence
- [ ] Reporting dashboard

#### Task 5.2: Implement Monitoring
**Priority**: Medium
**Estimated Time**: 6 hours

**Requirements**:
- API monitoring
- Database monitoring
- Error tracking
- Performance monitoring
- Alert system

**Monitoring Features**:
- API response times
- Database query performance
- Error rates and types
- System resource usage
- Automated alerts

**Acceptance Criteria**:
- [ ] API monitoring
- [ ] Database monitoring
- [ ] Error tracking
- [ ] Performance monitoring
- [ ] Alert system

## Technical Requirements

### Database Requirements
- PostgreSQL 13+
- Redis 6+ (for caching)
- Proper indexing strategy
- Connection pooling
- Query optimization

### API Requirements
- RESTful API design
- OpenAPI/Swagger documentation
- Proper HTTP status codes
- Error handling and logging
- Rate limiting and security

### Performance Requirements
- API response time < 200ms
- Database query time < 100ms
- Support for 1000+ concurrent users
- 99.9% uptime
- Scalable architecture

### Security Requirements
- Input validation and sanitization
- SQL injection prevention
- XSS prevention
- CSRF protection
- Data encryption
- Authentication and authorization

## Success Metrics

### Performance
- API response time < 200ms
- Database query time < 100ms
- 99.9% uptime
- Support for 1000+ concurrent users

### Functionality
- All CRUD operations working
- Advanced search functionality
- Proper error handling
- Data validation working

### Security
- No security vulnerabilities
- Proper input validation
- Secure data handling
- Access control working

## Notes

### Service vs Job Handling
**Recommendation**: Implement both approaches
- **Services**: Professionals post offerings with availability
- **Jobs**: People post requirements, professionals apply
- **Hybrid**: Allow both with clear UI distinction

### Property Listings
- Enhanced property-specific fields
- Integration with property management
- Virtual tour support (future)
- Property verification system

### Dynamic Categories
- Backend-driven category system
- Category-specific field definitions
- Validation rules per category
- Future extensibility

This document should be reviewed and updated as requirements evolve. Each task should be estimated and assigned to appropriate team members based on their expertise and availability.
