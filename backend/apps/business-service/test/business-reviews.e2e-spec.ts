import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { BusinessServiceModule } from '../src/business-service.module';
import { JwtService } from '@nestjs/jwt';

describe('Business Reviews (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let businessId: string;
  let reviewId: string;

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

    // Create a test business first
    const businessResponse = await request(app.getHttpServer())
      .post('/business/register')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        businessName: 'Test Business for Reviews',
        category: 'household-services',
        subcategory: 'Plumbing',
        serviceArea: '5km',
        pricingModel: 'hourly',
        availability: 'business-hours',
        yearsOfExperience: 3,
      });

    businessId = businessResponse.body.data.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/business/:businessId/reviews (POST)', () => {
    it('should create a new review', () => {
      return request(app.getHttpServer())
        .post(`/business/${businessId}/reviews`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          rating: 5,
          reviewText: 'Excellent service! Very professional and timely.',
          serviceQuality: 5,
          professionalism: 4,
          valueForMoney: 5,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('id');
          expect(res.body.data.rating).toBe(5);
          expect(res.body.data.reviewText).toBe('Excellent service! Very professional and timely.');
          reviewId = res.body.data.id;
        });
    });

    it('should fail with invalid rating', () => {
      return request(app.getHttpServer())
        .post(`/business/${businessId}/reviews`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          rating: 6, // Invalid rating (should be 1-5)
          reviewText: 'Great service!',
        })
        .expect(400);
    });

    it('should fail with missing required fields', () => {
      return request(app.getHttpServer())
        .post(`/business/${businessId}/reviews`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          reviewText: 'Great service!',
          // Missing required rating field
        })
        .expect(400);
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .post(`/business/${businessId}/reviews`)
        .send({
          rating: 5,
          reviewText: 'Great service!',
        })
        .expect(401);
    });
  });

  describe('/business/:businessId/reviews (GET)', () => {
    it('should get all reviews for a business', () => {
      return request(app.getHttpServer())
        .get(`/business/${businessId}/reviews`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          page: 1,
          limit: 10,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('meta');
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    it('should get reviews with rating filter', () => {
      return request(app.getHttpServer())
        .get(`/business/${businessId}/reviews`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          rating: 5,
          page: 1,
          limit: 10,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body).toHaveProperty('data');
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .get(`/business/${businessId}/reviews`)
        .expect(401);
    });
  });

  describe('/business/:businessId/reviews/stats (GET)', () => {
    it('should get review statistics for a business', () => {
      return request(app.getHttpServer())
        .get(`/business/${businessId}/reviews/stats`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('averageRating');
          expect(res.body.data).toHaveProperty('totalReviews');
          expect(res.body.data).toHaveProperty('ratingDistribution');
          expect(res.body.data).toHaveProperty('averageServiceQuality');
          expect(res.body.data).toHaveProperty('averageProfessionalism');
          expect(res.body.data).toHaveProperty('averageValueForMoney');
        });
    });
  });

  describe('/business/:businessId/reviews/:reviewId (PUT)', () => {
    it('should update a review', () => {
      return request(app.getHttpServer())
        .put(`/business/${businessId}/reviews/${reviewId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          rating: 4,
          reviewText: 'Updated review - still good service!',
          serviceQuality: 4,
          professionalism: 5,
          valueForMoney: 4,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.rating).toBe(4);
          expect(res.body.data.reviewText).toBe('Updated review - still good service!');
        });
    });

    it('should fail with invalid data', () => {
      return request(app.getHttpServer())
        .put(`/business/${businessId}/reviews/${reviewId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          rating: 0, // Invalid rating
          reviewText: 'Updated review',
        })
        .expect(400);
    });
  });

  describe('/business/:businessId/reviews/:reviewId/respond (POST)', () => {
    it('should allow business owner to respond to review', () => {
      return request(app.getHttpServer())
        .post(`/business/${businessId}/reviews/${reviewId}/respond`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          response: 'Thank you for your feedback! We appreciate your business.',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('response');
          expect(res.body.data).toHaveProperty('respondedAt');
        });
    });

    it('should fail with empty response', () => {
      return request(app.getHttpServer())
        .post(`/business/${businessId}/reviews/${reviewId}/respond`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          response: '', // Empty response
        })
        .expect(400);
    });
  });

  describe('/business/:businessId/reviews/:reviewId (DELETE)', () => {
    it('should delete a review', () => {
      return request(app.getHttpServer())
        .delete(`/business/${businessId}/reviews/${reviewId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);
    });

    it('should return 404 for already deleted review', () => {
      return request(app.getHttpServer())
        .get(`/business/${businessId}/reviews/${reviewId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});
