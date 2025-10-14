import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { MessagingServiceModule } from './messaging-service.module';

async function bootstrap() {
  const app = await NestFactory.create(MessagingServiceModule);
  
  // Enable CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
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
