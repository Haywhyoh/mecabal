import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { MessagingServiceModule } from './messaging-service.module';

async function bootstrap() {
  const app = await NestFactory.create(MessagingServiceModule);
  
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
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'DNT', 'User-Agent', 'If-Modified-Since', 'Cache-Control', 'Range'],
  });

  // Enable validation pipes
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }));

  const port = process.env.MESSAGING_PORT || 3004;
  await app.listen(port);
  
  console.log(`🚀 Messaging Service is running on port ${port}`);
}
void bootstrap();
