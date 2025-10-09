import { NestFactory } from '@nestjs/core';
import { UserServiceModule } from '../apps/user-service/src/user-service.module';
import { SeederService } from '../libs/database/src/seeds/seeder.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(UserServiceModule);
  const seederService = app.get(SeederService);
  
  try {
    await seederService.seedAll();
    console.log('✅ Database seeding completed successfully');
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

bootstrap();
