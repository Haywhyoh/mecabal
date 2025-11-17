import 'tsconfig-paths/register';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { LocationServiceModule } from './location-service.module';

async function bootstrap() {
  const app = await NestFactory.create(LocationServiceModule);

  // Enable CORS for production and development
  app.enableCors({
    origin: [
      // Production
      'https://mecabal.com',
      'https://www.mecabal.com',
      'https://api.mecabal.com',
      // Development
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:8080',
      'http://localhost:8081',
      'http://localhost:19000',
      'http://localhost:19001',
      'http://localhost:19002',
      'exp://localhost:19000',
      'exp://localhost:19001',
      'exp://localhost:19002',
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

  // Global validation pipe with detailed error messages
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (validationErrors) => {
        const formattedErrors = validationErrors.map((err) => ({
          property: err.property,
          value: err.value,
          constraints: err.constraints,
          children: err.children,
        }));
        return new BadRequestException({
          success: false,
          error: 'Validation failed',
          message: 'Please check your input data',
          validationErrors: formattedErrors,
          timestamp: new Date().toISOString(),
        });
      },
    }),
  );

  const port = process.env.LOCATION_SERVICE_PORT ?? 3007;
  await app.listen(port);
  console.log(`🌍 Location Service running on: http://localhost:${port}`);
}
bootstrap();
