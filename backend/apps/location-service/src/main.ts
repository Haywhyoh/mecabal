import 'tsconfig-paths/register';
import { NestFactory } from '@nestjs/core';
import { LocationServiceModule } from './location-service.module';

async function bootstrap() {
  const app = await NestFactory.create(LocationServiceModule);
  await app.listen(process.env.LOCATION_SERVICE_PORT ?? 3009);
}
bootstrap();
