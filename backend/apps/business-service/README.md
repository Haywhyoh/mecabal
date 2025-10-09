# MeCabal Business Service

## Overview

The Business Service is a comprehensive microservice that handles all business-related functionality in the MeCabal platform. It provides APIs for business registration, management, search, reviews, analytics, and customer inquiries.

## Features

### 🏢 Business Management
- **Business Registration**: Complete business profile creation with verification
- **Profile Management**: Update business information, status, and settings
- **Business Categories**: Comprehensive category and subcategory management
- **Service Management**: Add and manage business services offered

### 🔍 Search & Discovery
- **Advanced Search**: Full-text search with geographic and category filters
- **Geographic Search**: Location-based search with radius filtering
- **Service Area Search**: Search businesses by their service coverage areas
- **Featured & Trending**: Curated business listings

### ⭐ Reviews & Ratings
- **Review System**: Complete review and rating system
- **Multi-dimensional Ratings**: Service quality, professionalism, value for money
- **Review Management**: Update, delete, and respond to reviews
- **Statistics**: Comprehensive review analytics and statistics

### 📊 Analytics & Insights
- **Business Analytics**: Performance metrics and insights
- **Activity Logging**: Track business activities and interactions
- **Daily Statistics**: Detailed daily performance data
- **Conversion Tracking**: Monitor inquiry-to-job conversion rates

### 💬 Customer Inquiries
- **Inquiry System**: Customer inquiry and booking system
- **Response Management**: Business owner response handling
- **Status Tracking**: Inquiry status management
- **Communication**: Multiple contact preferences

### 🏆 Verification System
- **License Management**: Business license upload and verification
- **Verification Levels**: Basic, enhanced, and premium verification
- **Document Management**: Secure document storage and verification
- **Badge System**: Verification badges and status display

## API Endpoints

### Business Profile
- `POST /business/register` - Register new business
- `GET /business/my-business` - Get current user's business
- `GET /business/:id` - Get business by ID
- `PUT /business/:id` - Update business profile
- `PUT /business/:id/status` - Update business status
- `DELETE /business/:id` - Delete business profile

### Business Search
- `GET /business/search` - Search businesses with filters
- `GET /business/search/featured` - Get featured businesses
- `GET /business/search/trending` - Get trending businesses
- `GET /business/search/by-service-area` - Search by service area

### Business Categories
- `GET /business-categories` - Get all categories
- `GET /business-categories/search` - Search categories
- `GET /business-categories/:id` - Get category by ID
- `GET /business-categories/:id/subcategories` - Get subcategories

### Business Reviews
- `POST /business/:businessId/reviews` - Create review
- `GET /business/:businessId/reviews` - Get business reviews
- `GET /business/:businessId/reviews/stats` - Get review statistics
- `PUT /business/:businessId/reviews/:reviewId` - Update review
- `POST /business/:businessId/reviews/:reviewId/respond` - Respond to review
- `DELETE /business/:businessId/reviews/:reviewId` - Delete review

### Business Inquiries
- `POST /business/:businessId/inquiries` - Send inquiry
- `GET /business/:businessId/inquiries` - Get business inquiries
- `GET /business/:businessId/inquiries/stats` - Get inquiry statistics
- `POST /business/:businessId/inquiries/:inquiryId/respond` - Respond to inquiry
- `PUT /business/:businessId/inquiries/:inquiryId/status` - Update inquiry status
- `GET /user/inquiries` - Get user's inquiries

### Business Analytics
- `GET /business/:businessId/analytics` - Get business analytics
- `GET /business/:businessId/analytics/daily` - Get daily statistics
- `GET /business/:businessId/activity` - Get activity log
- `POST /business/:businessId/activity/view` - Log profile view
- `POST /business/:businessId/activity/contact-click` - Log contact click

### Business Licenses
- `POST /business/:businessId/licenses` - Add license
- `GET /business/:businessId/licenses` - Get business licenses
- `PUT /business/:businessId/licenses/:licenseId` - Update license
- `DELETE /business/:businessId/licenses/:licenseId` - Delete license
- `POST /business/:businessId/licenses/:licenseId/verify` - Verify license (Admin)

### Business Services
- `POST /business/:businessId/services` - Add business service
- `GET /business/:businessId/services` - Get business services
- `PUT /business/:businessId/services/:serviceId` - Update service
- `DELETE /business/:businessId/services/:serviceId` - Delete service

## Technology Stack

- **Framework**: NestJS
- **Database**: PostgreSQL with TypeORM
- **Authentication**: JWT with Passport
- **Validation**: Class-validator and class-transformer
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest with Supertest
- **File Storage**: MinIO/S3 compatible

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 13+
- Redis (for caching)
- MinIO/S3 (for file storage)

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd mecabal/backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment setup**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Database setup**:
   ```bash
   # Run migrations
   npm run migration:run
   
   # Seed data
   npm run db:seed
   ```

5. **Start the service**:
   ```bash
   npm run start:business
   ```

### Environment Variables

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=your_username
DB_PASSWORD=your_password
DB_NAME=mecabal

# JWT
JWT_SECRET=your_jwt_secret

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# File Storage
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=your_access_key
MINIO_SECRET_KEY=your_secret_key
MINIO_BUCKET_NAME=mecabal-business

# Service URLs
AUTH_SERVICE_URL=http://localhost:3001
USER_SERVICE_URL=http://localhost:3002
SOCIAL_SERVICE_URL=http://localhost:3003
MARKETPLACE_SERVICE_URL=http://localhost:3005
EVENTS_SERVICE_URL=http://localhost:3006
NOTIFICATION_SERVICE_URL=http://localhost:3007
```

## Testing

### Running Tests

```bash
# Run all tests
npm run test:business

# Run unit tests only
npm run test:business:unit

# Run E2E tests only
npm run test:business:e2e

# Run tests with coverage
npm run test:business:cov

# Run tests in watch mode
npm run test:business -- --watch
```

### Test Coverage

- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%
- **Statements**: 80%

### Test Structure

```
test/
├── business-profile.e2e-spec.ts    # E2E tests for business profiles
├── business-search.e2e-spec.ts     # E2E tests for search functionality
├── business-reviews.e2e-spec.ts    # E2E tests for reviews
└── setup.ts                        # Test setup configuration
```

## API Documentation

### Swagger Documentation

Once the service is running, visit:
- **Local**: http://localhost:3008/api/docs
- **Gateway**: http://localhost:3000/api/docs

### Postman Collection

A complete Postman collection is available at:
`postman/Business_Service_API.postman_collection.json`

## Database Schema

### Core Entities

- **BusinessProfile**: Main business entity
- **BusinessCategory**: Business categories and subcategories
- **BusinessService**: Services offered by businesses
- **BusinessLicense**: Business licenses and verification documents
- **BusinessReview**: Customer reviews and ratings
- **BusinessInquiry**: Customer inquiries and bookings
- **BusinessActivityLog**: Business activity tracking

### Relationships

```
User (1) ──→ (1) BusinessProfile
BusinessProfile (1) ──→ (N) BusinessService
BusinessProfile (1) ──→ (N) BusinessLicense
BusinessProfile (1) ──→ (N) BusinessReview
BusinessProfile (1) ──→ (N) BusinessInquiry
BusinessProfile (1) ──→ (N) BusinessActivityLog
BusinessCategory (1) ──→ (N) BusinessProfile
```

## Security

### Authentication
- JWT-based authentication
- Role-based access control
- Business ownership validation

### Authorization
- Business owners can only modify their own businesses
- Reviewers can only modify their own reviews
- Admin-only license verification

### Data Validation
- Input validation using class-validator
- SQL injection prevention
- XSS protection

## Performance

### Caching
- Redis caching for frequently accessed data
- Query result caching
- Session management

### Database Optimization
- Indexed columns for search performance
- Optimized queries with proper joins
- Pagination for large datasets

### Geographic Search
- PostGIS integration for location-based queries
- Efficient distance calculations
- Bounding box optimizations

## Monitoring

### Logging
- Structured logging with Winston
- Request/response logging
- Error tracking and monitoring

### Metrics
- Business performance metrics
- API response times
- Database query performance

### Health Checks
- Service health endpoints
- Database connectivity checks
- External service dependencies

## Deployment

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build:business
EXPOSE 3008
CMD ["npm", "run", "start:business"]
```

### Docker Compose

```yaml
version: '3.8'
services:
  business-service:
    build: .
    ports:
      - "3008:3008"
    environment:
      - NODE_ENV=production
      - DB_HOST=postgres
      - REDIS_HOST=redis
    depends_on:
      - postgres
      - redis
```

## Contributing

### Development Workflow

1. **Create feature branch**:
   ```bash
   git checkout -b feature/business-feature
   ```

2. **Make changes and test**:
   ```bash
   npm run test:business
   npm run lint
   ```

3. **Commit changes**:
   ```bash
   git commit -m "feat: add business feature"
   ```

4. **Push and create PR**:
   ```bash
   git push origin feature/business-feature
   ```

### Code Standards

- Follow NestJS best practices
- Use TypeScript strict mode
- Write comprehensive tests
- Document all public APIs
- Follow conventional commits

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Check database credentials
   - Ensure PostgreSQL is running
   - Verify database exists

2. **JWT Token Issues**
   - Check JWT_SECRET configuration
   - Verify token format and expiration
   - Ensure proper authentication headers

3. **File Upload Issues**
   - Check MinIO/S3 configuration
   - Verify bucket permissions
   - Check file size limits

4. **Search Performance**
   - Ensure proper database indexes
   - Check PostGIS installation
   - Monitor query performance

### Debug Mode

```bash
# Enable debug logging
DEBUG=* npm run start:business

# Run with verbose output
npm run start:business -- --verbose
```

## Support

For issues and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation wiki

## License

This project is licensed under the MIT License - see the LICENSE file for details.
