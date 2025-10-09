import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { BusinessServiceModule } from '../src/business-service.module';
import { JwtService } from '@nestjs/jwt';

describe('Business Search (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  // Mock JWT token for testing
  const mockUser = {
    userId: 'a4ba9886-ce30-43ea-9ac0-7ca4e5e45570',
    email: 'ayo@codemygig.com',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [BusinessServiceModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    // Generate JWT token for testing
    const jwtService = moduleFixture.get<JwtService>(JwtService);
    authToken = jwtService.sign(mockUser);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/business/search (GET)', () => {
    it('should search businesses with basic query', () => {
      return request(app.getHttpServer())
        .get('/business/search')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          query: 'plumber',
          page: 1,
          limit: 10,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('meta');
          expect(res.body.meta).toHaveProperty('total');
          expect(res.body.meta).toHaveProperty('page');
          expect(res.body.meta).toHaveProperty('limit');
        });
    });

    it('should search businesses with geographic filters', () => {
      return request(app.getHttpServer())
        .get('/business/search')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          query: 'plumber',
          latitude: 6.5244,
          longitude: 3.3792,
          radius: 5,
          state: 'Lagos',
          city: 'Lekki',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body).toHaveProperty('data');
        });
    });

    it('should search businesses with category filter', () => {
      return request(app.getHttpServer())
        .get('/business/search')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          category: 'household-services',
          subcategory: 'Plumbing',
          minRating: 4.0,
          verifiedOnly: true,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body).toHaveProperty('data');
        });
    });

    it('should search businesses with payment methods filter', () => {
      return request(app.getHttpServer())
        .get('/business/search')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          paymentMethods: ['cash', 'bank-transfer'],
          sortBy: 'rating',
          sortOrder: 'DESC',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body).toHaveProperty('data');
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .get('/business/search')
        .query({ query: 'plumber' })
        .expect(401);
    });
  });

  describe('/business/search/by-service-area (GET)', () => {
    it('should get businesses grouped by service area', () => {
      return request(app.getHttpServer())
        .get('/business/search/by-service-area')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          latitude: 6.5244,
          longitude: 3.3792,
          category: 'household-services',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body).toHaveProperty('data');
          expect(res.body.data).toHaveProperty('neighborhood');
          expect(res.body.data).toHaveProperty('2km');
          expect(res.body.data).toHaveProperty('5km');
          expect(res.body.data).toHaveProperty('10km');
          expect(res.body.data).toHaveProperty('city-wide');
          expect(res.body.data).toHaveProperty('state-wide');
          expect(res.body.data).toHaveProperty('nationwide');
        });
    });

    it('should fail without required parameters', () => {
      return request(app.getHttpServer())
        .get('/business/search/by-service-area')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });
  });

  describe('/business/search/featured (GET)', () => {
    it('should get featured businesses', () => {
      return request(app.getHttpServer())
        .get('/business/search/featured')
        .query({ limit: 5 })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body).toHaveProperty('data');
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    it('should get featured businesses with default limit', () => {
      return request(app.getHttpServer())
        .get('/business/search/featured')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body).toHaveProperty('data');
        });
    });
  });

  describe('/business/search/trending (GET)', () => {
    it('should get trending businesses', () => {
      return request(app.getHttpServer())
        .get('/business/search/trending')
        .query({ limit: 5 })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body).toHaveProperty('data');
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });
  });
});
