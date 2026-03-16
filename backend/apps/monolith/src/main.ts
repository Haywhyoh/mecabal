import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: true,
    rawBody: true,
  });

  // Configure body parser for file uploads (10MB limit)
  app.use(require('express').json({ limit: '10mb', type: ['application/json', 'text/plain'] }));
  app.use(require('express').urlencoded({ limit: '10mb', extended: true }));

  // Enable CORS for production and development
  app.enableCors({
    origin: [
      // Production
      'https://mecabal.com',
      'https://www.mecabal.com',
      'https://api.mecabal.com',
      // Development
      'http://localhost:3000',
      'http://localhost:3002',
      'http://localhost:3015',
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
      'ngrok-skip-browser-warning',
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
    .setTitle('MeCabal API')
    .setDescription('MeCabal - Nigerian community platform API')
    .setVersion('1.0')
    .addTag('Auth', 'Authentication and authorization')
    .addTag('Users', 'User profiles and management')
    .addTag('Social', 'Community feed and posts')
    .addTag('Messaging', 'Real-time messaging')
    .addTag('Marketplace', 'Local commerce and listings')
    .addTag('Events', 'Community events')
    .addTag('Location', 'Location and neighborhood services')
    .addTag('Business', 'Business profiles and services')
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
    .addServer(`http://localhost:${process.env.PORT || 3000}`, 'Development')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: 'MeCabal API Docs',
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`MeCabal API running on: http://localhost:${port}`);
  console.log(`Swagger UI available at: http://localhost:${port}/api/docs`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
}
void bootstrap();
