import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { EventCategory } from './libs/database/src/entities/event-category.entity';

// Load environment variables
config();

const categories = [
  { 
    name: 'Religious Services', 
    icon: 'church', 
    colorCode: '#7B68EE', 
    description: 'Church services, prayer meetings, religious ceremonies, and spiritual gatherings',
    displayOrder: 1 
  },
  { 
    name: 'Cultural Festivals', 
    icon: 'festival', 
    colorCode: '#FF6B35', 
    description: 'Traditional festivals, cultural celebrations, and heritage events',
    displayOrder: 2 
  },
  { 
    name: 'Community Events', 
    icon: 'account-group', 
    colorCode: '#4CAF50', 
    description: 'Neighborhood meetings, community cleanups, and local gatherings',
    displayOrder: 3 
  },
  { 
    name: 'Sports & Fitness', 
    icon: 'dumbbell', 
    colorCode: '#FF9800', 
    description: 'Football matches, fitness classes, sports tournaments, and athletic events',
    displayOrder: 4 
  },
  { 
    name: 'Educational', 
    icon: 'school', 
    colorCode: '#2196F3', 
    description: 'Workshops, seminars, training sessions, and educational programs',
    displayOrder: 5 
  },
  { 
    name: 'Business & Networking', 
    icon: 'briefcase', 
    colorCode: '#9C27B0', 
    description: 'Business meetings, networking events, conferences, and professional gatherings',
    displayOrder: 6 
  },
  { 
    name: 'Entertainment', 
    icon: 'music', 
    colorCode: '#E91E63', 
    description: 'Concerts, parties, shows, and entertainment events',
    displayOrder: 7 
  },
  { 
    name: 'Food & Dining', 
    icon: 'food', 
    colorCode: '#FF5722', 
    description: 'Food festivals, cooking classes, restaurant events, and culinary experiences',
    displayOrder: 8 
  },
  { 
    name: 'Health & Wellness', 
    icon: 'heart-pulse', 
    colorCode: '#00BCD4', 
    description: 'Health screenings, wellness workshops, medical camps, and fitness programs',
    displayOrder: 9 
  },
  { 
    name: 'Technology', 
    icon: 'laptop', 
    colorCode: '#607D8B', 
    description: 'Tech meetups, coding workshops, digital literacy programs, and innovation events',
    displayOrder: 10 
  }
];

async function seed() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    username: process.env.DATABASE_USERNAME || 'MeCabal_user',
    password: process.env.DATABASE_PASSWORD || 'MeCabal_password',
    database: process.env.DATABASE_NAME || 'MeCabal_dev',
    entities: ['libs/database/src/entities/*.entity{.ts,.js}'],
    synchronize: false,
    logging: false,
  });

  try {
    await dataSource.initialize();
    console.log('✅ Connected to database');

    const repo = dataSource.getRepository(EventCategory);

    for (const cat of categories) {
      const exists = await repo.findOne({ where: { name: cat.name } });
      if (!exists) {
        await repo.save(cat);
        console.log(`✓ Created category: ${cat.name}`);
      } else {
        console.log(`- Category already exists: ${cat.name}`);
      }
    }

    console.log('✅ Event categories seed completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding event categories:', error.message);
    throw error;
  } finally {
    await dataSource.destroy();
  }
}

seed().catch(console.error);
