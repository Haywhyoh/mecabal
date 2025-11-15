import 'tsconfig-paths/register';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { LocationServiceModule } from './location-service.module';

async function bootstrap() {
  const app = await NestFactory.create(LocationServiceModule);

  // CORS is handled by nginx reverse proxy
  // Disable CORS in the service to prevent duplicate headers
  // If you need CORS for local development, set DISABLE_NGINX_CORS=true
  if (process.env.DISABLE_NGINX_CORS === 'true') {
    app.enableCors({
      origin: true, // Allow all origins in development
      credentials: true,
    });
  }

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
