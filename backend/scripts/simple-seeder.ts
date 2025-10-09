import { NestFactory } from '@nestjs/core';
import { DatabaseModule } from '../libs/database/src/database.module';
import { SeederService } from '../libs/database/src/seeds/seeder.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(DatabaseModule);
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
