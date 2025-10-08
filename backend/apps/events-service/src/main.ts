import { NestFactory } from '@nestjs/core';
import { EventsServiceModule } from './events-service.module';

async function bootstrap() {
  const app = await NestFactory.create(EventsServiceModule);
  await app.listen(process.env.EVENTS_SERVICE_PORT ?? 3006);
}
void bootstrap();
