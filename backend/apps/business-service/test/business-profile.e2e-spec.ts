import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { BusinessServiceModule } from '../src/business-service.module';
import { JwtService } from '@nestjs/jwt';

describe('Business Profile (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let businessId: string;

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

  describe('/business/register (POST)', () => {
    it('should create a new business profile', () => {
      return request(app.getHttpServer())
        .post('/business/register')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          businessName: 'E2E Test Business',
          category: 'household-services',
          subcategory: 'Plumbing',
          serviceArea: '5km',
          pricingModel: 'hourly',
          availability: 'business-hours',
          yearsOfExperience: 3,
          description: 'Professional plumbing services',
          phoneNumber: '+2348012345678',
          businessAddress: '123 Test Street, Lagos',
          state: 'Lagos',
          city: 'Lekki',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('id');
          expect(res.body.data.businessName).toBe('E2E Test Business');
          businessId = res.body.data.id;
        });
    });

    it('should fail with invalid data', () => {
      return request(app.getHttpServer())
        .post('/business/register')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          businessName: '', // Invalid empty name
        })
        .expect(400);
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .post('/business/register')
        .send({
          businessName: 'Test Business',
          category: 'household-services',
        })
        .expect(401);
    });
  });

  describe('/business/my-business (GET)', () => {
    it('should retrieve current user business profile', () => {
      return request(app.getHttpServer())
        .get('/business/my-business')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.businessName).toBe('E2E Test Business');
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .get('/business/my-business')
        .expect(401);
    });
  });

  describe('/business/:id (GET)', () => {
    it('should retrieve business profile by ID', () => {
      return request(app.getHttpServer())
        .get(`/business/${businessId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.businessName).toBe('E2E Test Business');
        });
    });

    it('should return 404 for non-existent business', () => {
      return request(app.getHttpServer())
        .get('/business/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('/business/:id (PUT)', () => {
    it('should update business profile', () => {
      return request(app.getHttpServer())
        .put(`/business/${businessId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          businessName: 'Updated E2E Test Business',
          description: 'Updated description',
          phoneNumber: '+2348012345679',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.businessName).toBe('Updated E2E Test Business');
        });
    });

    it('should fail with invalid data', () => {
      return request(app.getHttpServer())
        .put(`/business/${businessId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          businessName: '', // Invalid empty name
        })
        .expect(400);
    });
  });

  describe('/business/:id/status (PUT)', () => {
    it('should update business status', () => {
      return request(app.getHttpServer())
        .put(`/business/${businessId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          isActive: false,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.isActive).toBe(false);
        });
    });
  });

  describe('/business/:id (DELETE)', () => {
    it('should delete business profile', () => {
      return request(app.getHttpServer())
        .delete(`/business/${businessId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);
    });

    it('should return 404 for already deleted business', () => {
      return request(app.getHttpServer())
        .get(`/business/${businessId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});
