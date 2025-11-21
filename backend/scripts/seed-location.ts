import * as crypto from 'crypto';
import { NestFactory } from '@nestjs/core';
import { SeederModule } from '../libs/database/src/seeds/seeder.module';
import { LocationSeeder } from '../libs/database/src/seeds/location.seed';

// Polyfill for Node.js compatibility
// Note: Node.js 22 has native crypto support, but this polyfill ensures compatibility
if (typeof (global as any).crypto === 'undefined') {
  (global as any).crypto = crypto;
}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(SeederModule);

  const locationSeeder = app.get(LocationSeeder);

  console.log('🌍 Starting location data seeding...\n');

  try {
    // Seed states
    console.log('📍 Seeding states...');
    await locationSeeder.seedStates();
    console.log('✅ States seeded successfully\n');

    // Seed all LGAs
    console.log('🏘️  Seeding Local Government Areas...');
    await locationSeeder.seedAllLGAs();
    console.log('✅ LGAs seeded successfully\n');

    // Seed sample wards (optional, only for Lagos)
    console.log('🗺️  Seeding sample wards...');
    await locationSeeder.seedWards();
    console.log('✅ Sample wards seeded successfully\n');

    // Seed neighborhoods
    console.log('🏡 Seeding neighborhoods...');
    await locationSeeder.seedNeighborhoods();
    console.log('✅ Neighborhoods seeded successfully\n');

    // Seed landmarks (optional)
    console.log('📌 Seeding landmarks...');
    await locationSeeder.seedLandmarks();
    console.log('✅ Landmarks seeded successfully\n');

    console.log('🎉 Location data seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error during location seeding:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

bootstrap();
