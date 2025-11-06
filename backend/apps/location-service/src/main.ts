import 'tsconfig-paths/register';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { LocationServiceModule } from './location-service.module';

async function bootstrap() {
  const app = await NestFactory.create(LocationServiceModule);

  // Enable CORS
  app.enableCors({
    origin: true, // Allow all origins in development
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.LOCATION_SERVICE_PORT ?? 3007;
  await app.listen(port);
  console.log(`🌍 Location Service running on: http://localhost:${port}`);
}
bootstrap();
