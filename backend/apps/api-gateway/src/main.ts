import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { ApiGatewayModule } from './api-gateway.module';
import { createProxyMiddleware } from 'http-proxy-middleware';

async function bootstrap() {
  const app = await NestFactory.create(ApiGatewayModule, {
    bodyParser: true,
    rawBody: true,
  });

  // Configure body parser to handle file uploads (10MB limit)
  app.use(require('express').json({ limit: '10mb' }));
  app.use(require('express').urlencoded({ limit: '10mb', extended: true }));

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

  // Configure WebSocket proxy for messaging service
  const messagingServiceUrl = process.env.MESSAGING_SERVICE_URL || 'http://localhost:3004';

  // Create WebSocket proxy middleware
  const wsProxy = createProxyMiddleware({
    target: messagingServiceUrl,
    changeOrigin: true,
    ws: true, // Enable WebSocket proxying
  });

  // Apply the proxy middleware for Socket.IO and messaging namespace
  app.use('/socket.io', wsProxy);
  app.use('/messaging', wsProxy);

  const port = 3000; // Force port 3000 for API gateway
  const server = await app.listen(port);

  // Handle WebSocket upgrade requests
  server.on('upgrade', (req: any, socket: any, head: any) => {
    console.log('🔌 WebSocket upgrade request:', req.url);
    console.log('🔌 Upgrade headers:', req.headers);
    
    // Apply the WebSocket proxy to the upgrade request
    wsProxy.upgrade(req, socket, head);
  });

  console.log(`🚀 API Gateway running on: http://localhost:${port}`);
  console.log(`📚 Swagger UI available at: http://localhost:${port}/api/docs`);
  console.log(`🔌 WebSocket proxy configured for: ${messagingServiceUrl}`);
}
void bootstrap();
