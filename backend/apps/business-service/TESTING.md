# Business Service Testing Guide

## Overview

This document provides comprehensive testing guidelines for the MeCabal Business Service. The testing suite includes unit tests, integration tests, and end-to-end (E2E) tests to ensure code quality and reliability.

## Test Structure

```
backend/apps/business-service/
├── src/
│   ├── business-profile/
│   │   └── business-profile.service.spec.ts    # Unit tests
│   ├── business-review/
│   │   └── business-review.service.spec.ts     # Unit tests
│   └── ...
├── test/
│   ├── business-profile.e2e-spec.ts            # E2E tests
│   ├── business-search.e2e-spec.ts             # E2E tests
│   ├── business-reviews.e2e-spec.ts            # E2E tests
│   └── setup.ts                                # Test setup
├── jest.config.js                              # Jest configuration
└── TESTING.md                                  # This file
```

## Test Types

### 1. Unit Tests
- **Location**: `src/**/*.spec.ts`
- **Purpose**: Test individual service methods and business logic
- **Coverage**: Services, utilities, and helper functions
- **Mocking**: External dependencies are mocked

### 2. Integration Tests
- **Location**: `test/**/*.e2e-spec.ts`
- **Purpose**: Test API endpoints and service interactions
- **Coverage**: Controllers, services, and database interactions
- **Environment**: Uses test database and real service instances

## Running Tests

### Prerequisites

1. **Environment Setup**:
   ```bash
   export NODE_ENV=test
   export JWT_SECRET=test-secret-key
   export DB_HOST=localhost
   export DB_PORT=5432
   export DB_USERNAME=test
   export DB_PASSWORD=test
   export DB_NAME=mecabal_test
   ```

2. **Database Setup**:
   ```bash
   # Create test database
   createdb mecabal_test
   
   # Run migrations
   npm run migration:run
   
   # Seed test data
   npm run db:seed
   ```

### Test Commands

```bash
# Run all business service tests
npm run test:business

# Run only unit tests
npm run test:business:unit

# Run only E2E tests
npm run test:business:e2e

# Run tests with coverage
npm run test:business:cov

# Run tests in watch mode
npm run test:business -- --watch

# Run specific test file
npm run test:business -- business-profile.service.spec.ts
```

## Test Configuration

### Jest Configuration (`jest.config.js`)

```javascript
module.exports = {
  displayName: 'Business Service',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/apps/business-service',
  testMatch: [
    '<rootDir>/src/**/*.spec.ts',
    '<rootDir>/test/**/*.e2e-spec.ts',
  ],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/**/*.interface.ts',
    '!src/**/*.dto.ts',
    '!src/**/*.module.ts',
    '!src/main.ts',
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  testTimeout: 30000,
};
```

## Test Examples

### Unit Test Example

```typescript
describe('BusinessProfileService', () => {
  let service: BusinessProfileService;
  let repository: Repository<BusinessProfile>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BusinessProfileService,
        {
          provide: getRepositoryToken(BusinessProfile),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<BusinessProfileService>(BusinessProfileService);
  });

  it('should create a new business profile', async () => {
    const userId = 'user-123';
    const createDto: CreateBusinessProfileDto = {
      businessName: 'Test Business',
      category: 'household-services',
      // ... other fields
    };

    mockRepository.findOne.mockResolvedValue(null);
    mockRepository.create.mockReturnValue({ ...createDto, userId });
    mockRepository.save.mockResolvedValue({ id: 'business-123', ...createDto, userId });

    const result = await service.create(userId, createDto);

    expect(result).toHaveProperty('id');
    expect(result.businessName).toBe(createDto.businessName);
    expect(mockRepository.create).toHaveBeenCalledWith({ ...createDto, userId });
    expect(mockRepository.save).toHaveBeenCalled();
  });
});
```

### E2E Test Example

```typescript
describe('Business Profile (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [BusinessServiceModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    const jwtService = moduleFixture.get<JwtService>(JwtService);
    authToken = jwtService.sign({ userId: 'test-user', email: 'test@example.com' });
  });

  it('should create a new business profile', () => {
    return request(app.getHttpServer())
      .post('/business/register')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        businessName: 'E2E Test Business',
        category: 'household-services',
        // ... other fields
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('id');
        expect(res.body.data.businessName).toBe('E2E Test Business');
      });
  });
});
```

## Test Data Management

### Mock Data

```typescript
const mockBusinessProfile = {
  id: 'business-123',
  userId: 'user-123',
  businessName: 'Test Business',
  category: 'household-services',
  subcategory: 'Plumbing',
  serviceArea: 'neighborhood',
  pricingModel: 'hourly',
  availability: 'business-hours',
  yearsOfExperience: 5,
  isActive: true,
  isVerified: false,
  verificationLevel: 'basic',
  rating: 0,
  reviewCount: 0,
  completedJobs: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
};
```

### Test Database

- **Database**: `mecabal_test`
- **Isolation**: Each test runs in a transaction that's rolled back
- **Seeding**: Test data is seeded before each test suite
- **Cleanup**: Database is cleaned after each test suite

## Coverage Requirements

- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%
- **Statements**: 80%

## Best Practices

### 1. Test Naming
- Use descriptive test names that explain what is being tested
- Follow the pattern: `should [expected behavior] when [condition]`

### 2. Test Structure
- **Arrange**: Set up test data and mocks
- **Act**: Execute the code under test
- **Assert**: Verify the expected outcome

### 3. Mocking
- Mock external dependencies (database, external APIs)
- Use realistic mock data
- Verify mock interactions

### 4. Test Isolation
- Each test should be independent
- Clean up after each test
- Use fresh data for each test

### 5. Error Testing
- Test both success and error scenarios
- Test validation errors
- Test authentication/authorization errors

## Debugging Tests

### Running Specific Tests
```bash
# Run tests matching a pattern
npm run test:business -- --testNamePattern="should create a new business profile"

# Run tests in a specific file
npm run test:business -- business-profile.service.spec.ts

# Run tests with verbose output
npm run test:business -- --verbose
```

### Debug Mode
```bash
# Run tests in debug mode
npm run test:debug
```

## Continuous Integration

### GitHub Actions
```yaml
name: Business Service Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:business:cov
      - uses: codecov/codecov-action@v1
```

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Ensure test database exists
   - Check database credentials
   - Verify database is running

2. **JWT Token Issues**
   - Ensure JWT_SECRET is set
   - Check token expiration
   - Verify token format

3. **Test Timeout**
   - Increase timeout in jest.config.js
   - Check for infinite loops
   - Verify async operations are properly awaited

4. **Mock Issues**
   - Ensure mocks are properly configured
   - Check mock return values
   - Verify mock interactions

## Performance Testing

### Load Testing
```bash
# Install artillery for load testing
npm install -g artillery

# Run load tests
artillery run load-tests/business-service.yml
```

### Memory Testing
```bash
# Run tests with memory profiling
node --inspect-brk node_modules/.bin/jest --runInBand
```

## Security Testing

### Authentication Tests
- Test JWT token validation
- Test token expiration
- Test invalid tokens

### Authorization Tests
- Test business ownership validation
- Test role-based access control
- Test resource access permissions

### Input Validation Tests
- Test SQL injection prevention
- Test XSS prevention
- Test input sanitization

## Monitoring and Reporting

### Coverage Reports
- HTML coverage report: `coverage/apps/business-service/index.html`
- LCOV report: `coverage/apps/business-service/lcov.info`
- Text report: Console output

### Test Reports
- JUnit XML: `test-results.xml`
- JSON report: `test-results.json`

## Conclusion

This testing guide provides a comprehensive framework for testing the Business Service. Following these guidelines ensures code quality, reliability, and maintainability. Regular testing helps catch bugs early and provides confidence in code changes.

For questions or issues, please refer to the development team or create an issue in the project repository.
