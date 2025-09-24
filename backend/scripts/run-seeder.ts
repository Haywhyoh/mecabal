import { NestFactory } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../libs/database/src/database.module';
import { SeederModule } from '../libs/database/src/seeds/seeder.module';
import { SeederService } from '../libs/database/src/seeds/seeder.service';

async function runSeeder() {
  console.log('🌱 Starting database seeder...');
  
  const app = await NestFactory.createApplicationContext({
    module: SeederModule,
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
      }),
      DatabaseModule,
      SeederModule,
    ],
  });
  const seederService = app.get(SeederService);

  try {
    await seederService.seedAll();
    console.log('✅ Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

// Run the seeder
if (require.main === module) {
  runSeeder();
}

export { runSeeder };
