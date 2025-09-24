import { DataSource } from 'typeorm';
import { config } from 'dotenv';

// Load environment variables
config();

// Mock neighborhood data from location.ts
const mockNeighborhoods = [
  {
    id: 'abesan-estate',
    name: 'Abesan Estate',
    state_name: 'Lagos',
    type: 'estate' as const,
    center: { latitude: 6.620, longitude: 3.260 },
    radius_km: 2.0,
    member_count: 234,
    recent_posts_count: 8
  },
  {
    id: 'ikeja-gra',
    name: 'Ikeja GRA',
    state_name: 'Lagos',
    type: 'estate' as const,
    center: { latitude: 6.605, longitude: 3.355 },
    radius_km: 1.2,
    member_count: 245,
    recent_posts_count: 12
  },
  {
    id: 'victoria-island',
    name: 'Victoria Island',
    state_name: 'Lagos',
    type: 'estate' as const,
    center: { latitude: 6.430, longitude: 3.415 },
    radius_km: 2.0,
    member_count: 189,
    recent_posts_count: 8
  },
  {
    id: 'lekki-phase1',
    name: 'Lekki Phase 1',
    state_name: 'Lagos',
    type: 'estate' as const,
    center: { latitude: 6.450, longitude: 3.505 },
    radius_km: 1.5,
    member_count: 156,
    recent_posts_count: 15
  },
  {
    id: 'banana-island',
    name: 'Banana Island',
    state_name: 'Lagos',
    type: 'estate' as const,
    center: { latitude: 6.440, longitude: 3.430 },
    radius_km: 0.8,
    member_count: 67,
    recent_posts_count: 3
  },
  {
    id: 'surulere-lagos',
    name: 'Surulere',
    state_name: 'Lagos',
    type: 'traditional_area' as const,
    center: { latitude: 6.495, longitude: 3.348 },
    radius_km: 3.5,
    member_count: 892,
    recent_posts_count: 24
  },
  {
    id: 'yaba-lagos',
    name: 'Yaba',
    state_name: 'Lagos',
    type: 'traditional_area' as const,
    center: { latitude: 6.515, longitude: 3.378 },
    radius_km: 2.8,
    member_count: 756,
    recent_posts_count: 18
  },
  {
    id: 'ikeja-main',
    name: 'Ikeja',
    state_name: 'Lagos',
    type: 'traditional_area' as const,
    center: { latitude: 6.595, longitude: 3.337 },
    radius_km: 4.0,
    member_count: 1243,
    recent_posts_count: 31
  }
];

// LGA mapping for Lagos neighborhoods
const lgaMapping: { [key: string]: string } = {
  'abesan-estate': 'Alimosho',
  'ikeja-gra': 'Ikeja',
  'victoria-island': 'Eti-Osa',
  'lekki-phase1': 'Eti-Osa',
  'banana-island': 'Eti-Osa',
  'surulere-lagos': 'Surulere',
  'yaba-lagos': 'Mainland',
  'ikeja-main': 'Ikeja'
};

async function seedNeighborhoods() {
  console.log('🌱 Starting working final neighborhood seeding...');
  
  // Create data source using the same configuration as ormconfig.ts
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    username: process.env.DATABASE_USERNAME || 'MeCabal_user',
    password: process.env.DATABASE_PASSWORD || 'MeCabal_password',
    database: process.env.DATABASE_NAME || 'MeCabal_dev',
    entities: ['libs/database/src/entities/*.entity{.ts,.js}'], // Use glob pattern like ormconfig.ts
    synchronize: false,
    logging: process.env.NODE_ENV === 'development'
  });

  try {
    await dataSource.initialize();
    console.log('✅ Database connection established');

    const neighborhoodRepo = dataSource.getRepository('Neighborhood');
    const lgaRepo = dataSource.getRepository('LocalGovernmentArea');
    const stateRepo = dataSource.getRepository('State');
    const userRepo = dataSource.getRepository('User');
    const userNeighborhoodRepo = dataSource.getRepository('UserNeighborhood');

    // First, ensure we have Lagos state
    let lagosState = await stateRepo.findOne({ where: { code: 'LA' } });
    if (!lagosState) {
      console.log('🏛️  Creating Lagos state...');
      lagosState = stateRepo.create({
        name: 'Lagos',
        code: 'LA'
      });
      await stateRepo.save(lagosState);
      console.log('✅ Lagos state created');
    } else {
      console.log('✅ Lagos state already exists');
    }

    // Get all LGAs to map neighborhoods
    const lgas = await lgaRepo.find();
    const lgaMap = new Map(lgas.map(lga => [lga.name.toLowerCase(), lga.id]));

    console.log(`📊 Found ${lgas.length} LGAs in database`);

    // If no LGAs exist, create them
    if (lgas.length === 0) {
      console.log('🏘️  Creating Lagos LGAs...');
      const lagosLgas = [
        'Agege', 'Ajeromi-Ifelodun', 'Alimosho', 'Amuwo-Odofin', 'Apapa',
        'Badagry', 'Epe', 'Eti-Osa', 'Ibeju-Lekki', 'Ifako-Ijaiye',
        'Ikeja', 'Ikorodu', 'Kosofe', 'Lagos Island', 'Lagos Mainland',
        'Mushin', 'Ojo', 'Oshodi-Isolo', 'Shomolu', 'Surulere'
      ].map((name) => ({ name, stateId: lagosState.id }));

      await lgaRepo.save(lagosLgas);
      console.log(`✅ Created ${lagosLgas.length} Lagos LGAs`);
      
      // Refresh the LGA map
      const updatedLgas = await lgaRepo.find();
      lgaMap.clear();
      updatedLgas.forEach(lga => lgaMap.set(lga.name.toLowerCase(), lga.id));
    }

    // Get a real user ID for createdBy field - use the first user or null
    let createdByUserId = null;
    try {
      const users = await userRepo.find({ take: 1 });
      if (users.length > 0) {
        createdByUserId = users[0].id;
        console.log(`👤 Using user ${users[0].firstName} ${users[0].lastName} as creator`);
      } else {
        console.log('👤 No users found, using null for createdBy');
      }
    } catch (error) {
      console.log('👤 Could not find users, using null for createdBy');
    }

    let createdCount = 0;
    let updatedCount = 0;

    for (const mockNeighborhood of mockNeighborhoods) {
      try {
        // Find the LGA for this neighborhood
        const lgaName = lgaMapping[mockNeighborhood.id] || 'Ikeja'; // Default to Ikeja
        const lgaId = lgaMap.get(lgaName.toLowerCase());
        
        if (!lgaId) {
          console.warn(`⚠️  LGA not found for ${mockNeighborhood.name}, skipping...`);
          continue;
        }

        // Check if neighborhood already exists
        const existingNeighborhood = await neighborhoodRepo.findOne({
          where: { name: mockNeighborhood.name }
        });

        const neighborhoodData = {
          name: mockNeighborhood.name,
          description: `${mockNeighborhood.name} is a ${mockNeighborhood.type.replace('_', ' ')} in ${mockNeighborhood.state_name}`,
          lgaId: lgaId,
          centerLatitude: mockNeighborhood.center.latitude,
          centerLongitude: mockNeighborhood.center.longitude,
          radiusMeters: mockNeighborhood.radius_km * 1000, // Convert km to meters
          isVerified: true,
          createdBy: createdByUserId // Use real user ID or null
        };

        if (existingNeighborhood) {
          // Update existing neighborhood
          await neighborhoodRepo.update(existingNeighborhood.id, neighborhoodData);
          updatedCount++;
          console.log(`✅ Updated neighborhood: ${mockNeighborhood.name}`);
        } else {
          // Create new neighborhood
          const newNeighborhood = neighborhoodRepo.create(neighborhoodData);
          await neighborhoodRepo.save(newNeighborhood);
          createdCount++;
          console.log(`🆕 Created neighborhood: ${mockNeighborhood.name}`);
        }
      } catch (error) {
        console.error(`❌ Error processing ${mockNeighborhood.name}:`, error);
      }
    }

    console.log(`\n📈 Seeding Summary:`);
    console.log(`   🆕 Created: ${createdCount} neighborhoods`);
    console.log(`   ✅ Updated: ${updatedCount} neighborhoods`);

    // Now associate existing users with Abesan Estate
    console.log('\n🏠 Associating existing users with Abesan Estate...');
    
    const abesanEstate = await neighborhoodRepo.findOne({
      where: { name: 'Abesan Estate' }
    });

    if (!abesanEstate) {
      console.error('❌ Abesan Estate not found! Please run the seeding first.');
      return;
    }

    // Get all users who don't have any neighborhood associations
    const usersWithoutNeighborhoods = await userRepo
      .createQueryBuilder('user')
      .leftJoin('user.userNeighborhoods', 'userNeighborhood')
      .where('userNeighborhood.id IS NULL')
      .getMany();

    console.log(`👥 Found ${usersWithoutNeighborhoods.length} users without neighborhoods`);

    let associatedCount = 0;
    for (const user of usersWithoutNeighborhoods) {
      try {
        // Check if user is already associated with Abesan Estate
        const existingAssociation = await userNeighborhoodRepo.findOne({
          where: {
            userId: user.id,
            neighborhoodId: abesanEstate.id
          }
        });

        if (!existingAssociation) {
          const userNeighborhood = userNeighborhoodRepo.create({
            userId: user.id,
            neighborhoodId: abesanEstate.id,
            relationshipType: 'resident',
            verificationMethod: 'manual',
            isPrimary: true, // Set as primary neighborhood
            joinedAt: new Date()
          });

          await userNeighborhoodRepo.save(userNeighborhood);
          associatedCount++;
          console.log(`✅ Associated user ${user.firstName} ${user.lastName} with Abesan Estate`);
        }
      } catch (error) {
        console.error(`❌ Error associating user ${user.id}:`, error);
      }
    }

    console.log(`\n🎉 Successfully associated ${associatedCount} users with Abesan Estate`);

  } catch (error) {
    console.error('❌ Error during seeding:', error);
  } finally {
    await dataSource.destroy();
  }
}

// Run the seeder
if (require.main === module) {
  seedNeighborhoods()
    .then(() => {
      console.log('✅ Working final neighborhood seeding completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Neighborhood seeding failed:', error);
      process.exit(1);
    });
}

export { seedNeighborhoods };
