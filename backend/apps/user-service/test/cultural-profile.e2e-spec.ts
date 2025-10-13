import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import * as request from 'supertest';
import { DatabaseModule } from '@app/database';
import { AuthModule } from '@app/auth';
import { UserServiceModule } from '../src/user-service.module';
import { CulturalProfileService } from '../src/services/cultural-profile.service';

describe('Cultural Profile (e2e)', () => {
  let app: INestApplication;
  let culturalProfileService: CulturalProfileService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        DatabaseModule,
        AuthModule,
        UserServiceModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    culturalProfileService = moduleFixture.get<CulturalProfileService>(CulturalProfileService);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/cultural-profile/reference-data (GET)', () => {
    it('should return reference data', () => {
      return request(app.getHttpServer())
        .get('/cultural-profile/reference-data')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('states');
          expect(res.body).toHaveProperty('languages');
          expect(res.body).toHaveProperty('culturalBackgrounds');
          expect(res.body).toHaveProperty('professionalCategories');
          expect(Array.isArray(res.body.states)).toBe(true);
          expect(Array.isArray(res.body.languages)).toBe(true);
          expect(Array.isArray(res.body.culturalBackgrounds)).toBe(true);
          expect(Array.isArray(res.body.professionalCategories)).toBe(true);
        });
    });
  });

  describe('/cultural-profile/:userId (GET)', () => {
    it('should return 401 for unauthenticated request', () => {
      return request(app.getHttpServer())
        .get('/cultural-profile/test-user-id')
        .expect(401);
    });
  });

  describe('/cultural-profile/:userId (POST)', () => {
    it('should return 401 for unauthenticated request', () => {
      const createDto = {
        stateOfOriginId: 'lagos',
        culturalBackgroundId: 'yoruba',
        professionalCategoryId: 'tech',
        professionalTitle: 'Software Engineer',
        languages: [
          {
            languageId: 'english',
            proficiency: 'native',
          },
        ],
        privacySettings: {
          showCulturalBackground: true,
          showLanguages: true,
          showProfessionalCategory: true,
          showStateOfOrigin: true,
          allowCulturalMatching: true,
        },
      };

      return request(app.getHttpServer())
        .post('/cultural-profile/test-user-id')
        .send(createDto)
        .expect(401);
    });
  });

  describe('/cultural-profile/:userId/languages (POST)', () => {
    it('should return 401 for unauthenticated request', () => {
      const addLanguageDto = {
        languageId: 'english',
        proficiency: 'native',
      };

      return request(app.getHttpServer())
        .post('/cultural-profile/test-user-id/languages')
        .send(addLanguageDto)
        .expect(401);
    });
  });

  describe('/cultural-profile/search/cultural-matching (GET)', () => {
    it('should return 401 for unauthenticated request', () => {
      return request(app.getHttpServer())
        .get('/cultural-profile/search/cultural-matching')
        .expect(401);
    });
  });
});


