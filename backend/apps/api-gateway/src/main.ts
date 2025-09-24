import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { ApiGatewayModule } from './api-gateway.module';

async function bootstrap() {
  const app = await NestFactory.create(ApiGatewayModule);

  // Enable CORS for API testing
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
    ],
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

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('MeCabal API Gateway')
    .setDescription(
      'Main API Gateway for MeCabal - Nigerian community platform. Routes requests to microservices.',
    )
    .setVersion('1.0')
    .addTag('Gateway', 'API Gateway endpoints and routing')
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
    .addServer('http://localhost:3000', 'Development API Gateway')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: 'MeCabal Gateway API Docs',
  });

  const port = 3000; // Force port 3000 for API gateway
  await app.listen(port);

  console.log(`🚀 API Gateway running on: http://localhost:${port}`);
  console.log(`📚 Swagger UI available at: http://localhost:${port}/api/docs`);
}
bootstrap();
