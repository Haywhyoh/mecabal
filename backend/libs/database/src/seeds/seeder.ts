// Polyfill for crypto in Node.js environments where it's not available globally
// This is needed because @nestjs/typeorm uses crypto.randomUUID() which expects crypto to be a global
import * as crypto from 'crypto';
if (typeof globalThis.crypto === 'undefined') {
  // Ensure randomUUID is available (Node.js 15.6.0+)
  const randomUUID = crypto.randomUUID || (() => {
    // Fallback UUID generator for older Node.js versions
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  });
  
  // Make crypto available globally with randomUUID method
  (globalThis as any).crypto = {
    randomUUID,
  };
}

import { NestFactory } from '@nestjs/core';
import { SeederModule } from './seeder.module';
import { SeederService } from './seeder.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(SeederModule);
  const seeder = app.get(SeederService);

  try {
    await seeder.seedAll();
    console.log('✅ Seeding completed successfully');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await app.close();
  }
}

bootstrap();
