import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { MessagingServiceModule } from './messaging-service.module';

async function bootstrap() {
  const app = await NestFactory.create(MessagingServiceModule);
  
  // Enable CORS
  app.enableCors({
    origin: [
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
      'http://192.168.1.100:3000', // Local network
      'http://192.168.1.100:3004', // Local network
      'http://10.0.2.2:3000', // Android emulator
      'http://10.0.2.2:3004', // Android emulator
      'https://guided-gobbler-outgoing.ngrok-free.app', // Your ngrok domain
      /^https:\/\/.*\.ngrok-free\.app$/, // Allow all ngrok domains
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
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
