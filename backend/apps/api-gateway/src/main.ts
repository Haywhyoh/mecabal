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
      'http://localhost:3004', // Next.js frontend
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
      'ngrok-skip-browser-warning',  // For ngrok/tunneling
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

  // Configure proxy for messaging service
  const messagingServiceUrl = process.env.MESSAGING_SERVICE_URL || 'http://localhost:3004';

  // Create HTTP proxy middleware for REST API
  const httpProxy = createProxyMiddleware({
    target: messagingServiceUrl,
    changeOrigin: true,
    pathRewrite: {
      '^/messaging': '/messaging', // Keep the /messaging prefix
    },
  });

  // Create WebSocket proxy middleware
  const wsProxy = createProxyMiddleware({
    target: messagingServiceUrl,
    changeOrigin: true,
    ws: true, // Enable WebSocket proxying
  });

  // Apply the proxy middleware for HTTP REST API and WebSocket
  app.use('/messaging', httpProxy); // HTTP REST API routes
  app.use('/socket.io', wsProxy); // WebSocket connections

  const port = 3000; // Force port 3000 for API gateway
  const server = await app.listen(port);

  // Handle WebSocket upgrade requests
  server.on('upgrade', (req: any, socket: any, head: any) => {
    console.log('🔌 WebSocket upgrade request:', req.url);
    console.log('🔌 Upgrade headers:', req.headers);
    
    // Only handle WebSocket upgrades for /socket.io
    if (req.url?.startsWith('/socket.io')) {
      wsProxy.upgrade(req, socket, head);
    } else {
      // For other WebSocket requests, close the connection
      socket.destroy();
    }
  });

  console.log(`🚀 API Gateway running on: http://localhost:${port}`);
  console.log(`📚 Swagger UI available at: http://localhost:${port}/api/docs`);
  console.log(`🔌 WebSocket proxy configured for: ${messagingServiceUrl}`);
  console.log(`✅ Environment: ${process.env.NODE_ENV}`);
}
void bootstrap();
