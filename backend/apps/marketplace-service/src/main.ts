import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { MarketplaceServiceModule } from './marketplace-service.module';

async function bootstrap() {
  const app = await NestFactory.create(MarketplaceServiceModule);

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
    .setTitle('MeCabal Marketplace Service API')
    .setDescription(
      'Local marketplace and commerce service for MeCabal - Nigerian community platform',
    )
    .setVersion('1.0')
    .addTag('Products', 'Product listings and catalog management')
    .addTag('Orders', 'Order processing and management')
    .addTag('Payments', 'Payment processing endpoints')
    .addTag('Reviews', 'Product and seller reviews')
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
    .addServer('http://localhost:3005', 'Development Marketplace Service')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: 'MeCabal Marketplace API Docs',
  });

  const port = process.env.MARKETPLACE_SERVICE_PORT ?? 3005;
  await app.listen(port);

  console.log(`🚀 Marketplace Service running on: http://localhost:${port}`);
  console.log(`📚 Swagger UI available at: http://localhost:${port}/api/docs`);
}
void bootstrap();
