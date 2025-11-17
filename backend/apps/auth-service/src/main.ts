import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AuthServiceModule } from './auth-service.module';

async function bootstrap() {
  const app = await NestFactory.create(AuthServiceModule);

  // Enable CORS for production and development
  app.enableCors({
    origin: [
      // Production
      'https://mecabal.com',
      'https://www.mecabal.com',
      'https://api.mecabal.com',
      // Local development
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:8080',
      'http://localhost:8081', // Expo development server
      'http://localhost:19000', // Expo web
      'http://localhost:19001', // Expo web
      'http://localhost:19002', // Expo web
      'exp://localhost:19000', // Expo development
      'exp://localhost:19001', // Expo development
      'exp://localhost:19002', // Expo development
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'DNT',
      'User-Agent',
      'If-Modified-Since',
      'Cache-Control',
      'Range',
      'ngrok-skip-browser-warning',  // For ngrok/tunneling
      'Accept',
      'Origin',
    ],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('MeCabal Auth Service API')
    .setDescription(
      'Authentication and authorization service for MeCabal - Nigerian community platform',
    )
    .setVersion('1.0')
    .addTag('Authentication', 'User authentication and authorization endpoints')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addServer('http://localhost:3001', 'Development Auth Service')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: 'MeCabal Auth API Docs',
  });

  const port = 3001; // Force port 3001 for auth service
  await app.listen(port);

  console.log(`🚀 Auth Service running on: http://localhost:${port}`);
  console.log(`📚 Swagger UI available at: http://localhost:${port}/api/docs`);
}
void bootstrap();
