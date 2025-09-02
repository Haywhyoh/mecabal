import { DataSource } from 'typeorm';
import { config } from 'dotenv';

// Load environment variables
config();

export default new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USERNAME || 'MeCabal_user',
  password: process.env.DATABASE_PASSWORD || 'MeCabal_password',
  database: process.env.DATABASE_NAME || 'MeCabal_dev',
  entities: ['libs/database/src/entities/*.entity{.ts,.js}'],
  migrations: ['libs/database/src/migrations/*{.ts,.js}'],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false,
});