import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { SocialServiceModule } from './social-service.module';

async function bootstrap() {
  const app = await NestFactory.create(SocialServiceModule);

  // Enable CORS for API testing
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:8080'],
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('MeCabal Social Service API')
    .setDescription('Community posts, feeds, and social interactions for MeCabal - Nigerian community platform')
    .setVersion('1.0')
    .addTag('Posts', 'Community posts and content management')
    .addTag('Feed', 'Social feed and timeline endpoints')
    .addTag('Reactions', 'Post reactions and interactions')
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
    .addServer('http://localhost:3003', 'Development Social Service')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: 'MeCabal Social API Docs',
  });

  const port = process.env.PORT ?? 3003;
  await app.listen(port);

  console.log(`🚀 Social Service running on: http://localhost:${port}`);
  console.log(`📚 Swagger UI available at: http://localhost:${port}/api/docs`);
}
bootstrap();
