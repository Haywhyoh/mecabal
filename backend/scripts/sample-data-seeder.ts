import { DataSource } from 'typeorm';
import { config } from 'dotenv';

// Load environment variables
config();

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

interface SampleListing {
  title: string;
  description: string;
  listingType: 'property' | 'item' | 'service' | 'job';
  price: number;
  currency: string;
  priceType: 'fixed' | 'negotiable' | 'starting_from';
  categoryId: number;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  // Service-specific fields
  serviceType?: 'offering' | 'request';
  availabilitySchedule?: any;
  serviceRadius?: number;
  professionalCredentials?: any;
  pricingModel?: 'hourly' | 'project' | 'fixed' | 'negotiable';
  responseTime?: number;
  // Job-specific fields
  employmentType?: 'full_time' | 'part_time' | 'contract' | 'freelance';
  salaryMin?: number;
  salaryMax?: number;
  applicationDeadline?: Date;
  requiredSkills?: string[];
  workLocation?: 'remote' | 'on_site' | 'hybrid';
  companyInfo?: any;
  // Property-specific fields
  propertyType?: 'apartment' | 'house' | 'commercial' | 'land';
  bedrooms?: number;
  bathrooms?: number;
  propertyAmenities?: string[];
  utilitiesIncluded?: string[];
  petPolicy?: 'allowed' | 'not_allowed' | 'case_by_case';
  parkingSpaces?: number;
  securityFeatures?: string[];
  propertySize?: number;
  landSize?: number;
  // Enhanced fields
  estateId?: string;
  city?: string;
  state?: string;
  featured?: boolean;
  boosted?: boolean;
  verificationStatus?: 'pending' | 'verified' | 'rejected';
  contactPreferences?: any;
}

const sampleListings: SampleListing[] = [
  // PROPERTY LISTINGS
  {
    title: 'Beautiful 3-Bedroom Apartment in Lekki',
    description: 'Spacious 3-bedroom apartment with modern amenities, located in the heart of Lekki Phase 1. Close to shopping malls, schools, and hospitals.',
    listingType: 'property',
    price: 2500000,
    currency: 'NGN',
    priceType: 'fixed',
    categoryId: 1, // Will be updated with actual category ID
    location: {
      latitude: 6.4654,
      longitude: 3.5656,
      address: 'Lekki Phase 1, Lagos'
    },
    propertyType: 'apartment',
    bedrooms: 3,
    bathrooms: 2,
    propertyAmenities: ['Swimming Pool', 'Gym', 'Parking', 'Security', 'Garden'],
    utilitiesIncluded: ['Water', 'Electricity', 'Internet'],
    petPolicy: 'case_by_case',
    parkingSpaces: 2,
    securityFeatures: ['24/7 Security', 'CCTV', 'Access Control'],
    propertySize: 120,
    city: 'Lagos',
    state: 'Lagos State',
    featured: true,
    verificationStatus: 'verified'
  },
  {
    title: 'Modern 4-Bedroom Duplex in Victoria Island',
    description: 'Luxurious 4-bedroom duplex with stunning ocean views. Perfect for families looking for comfort and elegance.',
    listingType: 'property',
    price: 4500000,
    currency: 'NGN',
    priceType: 'negotiable',
    categoryId: 2, // Will be updated with actual category ID
    location: {
      latitude: 6.4281,
      longitude: 3.4219,
      address: 'Victoria Island, Lagos'
    },
    propertyType: 'house',
    bedrooms: 4,
    bathrooms: 3,
    propertyAmenities: ['Swimming Pool', 'Gym', 'Parking', 'Security', 'Garden', 'Balcony'],
    utilitiesIncluded: ['Water', 'Electricity', 'Internet', 'Cable TV'],
    petPolicy: 'allowed',
    parkingSpaces: 3,
    securityFeatures: ['24/7 Security', 'CCTV', 'Access Control', 'Alarm System'],
    propertySize: 200,
    landSize: 300,
    city: 'Lagos',
    state: 'Lagos State',
    featured: true,
    verificationStatus: 'verified'
  },

  // ITEM LISTINGS
  {
    title: 'iPhone 14 Pro Max 256GB - Like New',
    description: 'iPhone 14 Pro Max in excellent condition. Used for 3 months, comes with original box, charger, and screen protector.',
    listingType: 'item',
    price: 450000,
    currency: 'NGN',
    priceType: 'fixed',
    categoryId: 3, // Will be updated with actual category ID
    location: {
      latitude: 6.5244,
      longitude: 3.3792,
      address: 'Ikeja, Lagos'
    },
    city: 'Lagos',
    state: 'Lagos State',
    verificationStatus: 'verified'
  },
  {
    title: 'MacBook Pro M2 13-inch - Brand New',
    description: 'Brand new MacBook Pro M2 chip, 13-inch display, 8GB RAM, 256GB SSD. Still sealed in original packaging.',
    listingType: 'item',
    price: 850000,
    currency: 'NGN',
    priceType: 'fixed',
    categoryId: 4, // Will be updated with actual category ID
    location: {
      latitude: 6.5244,
      longitude: 3.3792,
      address: 'Ikeja, Lagos'
    },
    city: 'Lagos',
    state: 'Lagos State',
    verificationStatus: 'verified'
  },

  // SERVICE LISTINGS
  {
    title: 'Professional Home Cleaning Services',
    description: 'Experienced cleaning team offering comprehensive home cleaning services. We use eco-friendly products and modern equipment.',
    listingType: 'service',
    price: 15000,
    currency: 'NGN',
    priceType: 'starting_from',
    categoryId: 5, // Will be updated with actual category ID
    location: {
      latitude: 6.5244,
      longitude: 3.3792,
      address: 'Lagos'
    },
    serviceType: 'offering',
    availabilitySchedule: {
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      startTime: '08:00',
      endTime: '18:00',
      timezone: 'Africa/Lagos'
    },
    serviceRadius: 25,
    professionalCredentials: {
      certifications: ['Professional Cleaning Certificate'],
      experience: '5 years',
      insurance: true
    },
    pricingModel: 'project',
    responseTime: 2,
    city: 'Lagos',
    state: 'Lagos State',
    featured: true,
    verificationStatus: 'verified'
  },
  {
    title: 'Digital Marketing Consultant',
    description: 'Expert digital marketing consultant with 8+ years experience. Specializing in social media marketing, SEO, and content strategy.',
    listingType: 'service',
    price: 50000,
    currency: 'NGN',
    priceType: 'starting_from',
    categoryId: 6, // Will be updated with actual category ID
    location: {
      latitude: 6.5244,
      longitude: 3.3792,
      address: 'Lagos'
    },
    serviceType: 'offering',
    availabilitySchedule: {
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      startTime: '09:00',
      endTime: '17:00',
      timezone: 'Africa/Lagos'
    },
    serviceRadius: 50,
    professionalCredentials: {
      certifications: ['Google Ads Certified', 'Facebook Blueprint Certified', 'HubSpot Certified'],
      experience: '8 years',
      portfolio: 'Available upon request'
    },
    pricingModel: 'hourly',
    responseTime: 4,
    city: 'Lagos',
    state: 'Lagos State',
    featured: true,
    verificationStatus: 'verified'
  },

  // JOB LISTINGS
  {
    title: 'Senior React Developer - Remote',
    description: 'We are looking for an experienced React developer to join our growing team. Must have 3+ years experience with React, TypeScript, and modern frontend tools.',
    listingType: 'job',
    price: 0,
    currency: 'NGN',
    priceType: 'fixed',
    categoryId: 7, // Will be updated with actual category ID
    location: {
      latitude: 6.5244,
      longitude: 3.3792,
      address: 'Lagos'
    },
    employmentType: 'full_time',
    salaryMin: 300000,
    salaryMax: 500000,
    applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    requiredSkills: ['React', 'TypeScript', 'JavaScript', 'HTML', 'CSS', 'Git'],
    workLocation: 'remote',
    companyInfo: {
      name: 'TechCorp Nigeria',
      size: '50-100 employees',
      industry: 'Technology',
      website: 'https://techcorp.ng'
    },
    city: 'Lagos',
    state: 'Lagos State',
    featured: true,
    verificationStatus: 'verified'
  },
  {
    title: 'Data Scientist - Hybrid',
    description: 'Join our data team to build machine learning models and analyze large datasets. Experience with Python, SQL, and ML frameworks required.',
    listingType: 'job',
    price: 0,
    currency: 'NGN',
    priceType: 'fixed',
    categoryId: 8, // Will be updated with actual category ID
    location: {
      latitude: 6.5244,
      longitude: 3.3792,
      address: 'Lagos'
    },
    employmentType: 'full_time',
    salaryMin: 400000,
    salaryMax: 600000,
    applicationDeadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
    requiredSkills: ['Python', 'SQL', 'Machine Learning', 'Statistics', 'Pandas', 'Scikit-learn'],
    workLocation: 'hybrid',
    companyInfo: {
      name: 'DataFlow Solutions',
      size: '20-50 employees',
      industry: 'Data & Analytics',
      website: 'https://dataflow.ng'
    },
    city: 'Lagos',
    state: 'Lagos State',
    featured: true,
    verificationStatus: 'verified'
  }
];

async function seedSampleData() {
  console.log('🌱 Starting sample data seeding...');
  
  try {
    await dataSource.initialize();
    console.log('✅ Database connection established');

    // Get category IDs
    const categories = await dataSource.query(`
      SELECT id, name, listing_type 
      FROM listing_categories 
      ORDER BY id
    `);

    console.log('📁 Available categories:', categories.map((c: any) => `${c.name} (${c.listing_type})`));

    // Create a mapping of category names to IDs
    const categoryMap = new Map();
    categories.forEach((cat: any) => {
      categoryMap.set(cat.name.toLowerCase(), cat.id);
    });

    // Get a sample user ID (assuming there's at least one user)
    const users = await dataSource.query('SELECT id FROM users LIMIT 1');
    if (users.length === 0) {
      console.log('❌ No users found. Please create a user first.');
      return;
    }
    const userId = users[0].id;
    console.log(`👤 Using user ID: ${userId}`);

    // Get a sample neighborhood ID
    const neighborhoods = await dataSource.query('SELECT id FROM neighborhoods LIMIT 1');
    if (neighborhoods.length === 0) {
      console.log('❌ No neighborhoods found. Please create a neighborhood first.');
      return;
    }
    const neighborhoodId = neighborhoods[0].id;
    console.log(`🏘️ Using neighborhood ID: ${neighborhoodId}`);

    // Clear existing listings
    await dataSource.query('DELETE FROM listings');
    console.log('🗑️ Cleared existing listings');

    // Insert sample listings
    for (const listing of sampleListings) {
      // Map category based on listing type and name
      let categoryId = 1; // Default fallback
      
      if (listing.listingType === 'property') {
        if (listing.title.includes('Apartment')) {
          categoryId = categoryMap.get('apartments') || 1;
        } else if (listing.title.includes('Duplex') || listing.title.includes('House')) {
          categoryId = categoryMap.get('houses') || 1;
        }
      } else if (listing.listingType === 'item') {
        if (listing.title.includes('iPhone') || listing.title.includes('Mobile')) {
          categoryId = categoryMap.get('mobile phones') || 1;
        } else if (listing.title.includes('MacBook') || listing.title.includes('Laptop')) {
          categoryId = categoryMap.get('computers & laptops') || 1;
        }
      } else if (listing.listingType === 'service') {
        if (listing.title.includes('Cleaning')) {
          categoryId = categoryMap.get('home services') || 1;
        } else if (listing.title.includes('Marketing')) {
          categoryId = categoryMap.get('business services') || 1;
        }
      } else if (listing.listingType === 'job') {
        if (listing.title.includes('React') || listing.title.includes('Developer')) {
          categoryId = categoryMap.get('software development') || 1;
        } else if (listing.title.includes('Data') || listing.title.includes('Scientist')) {
          categoryId = categoryMap.get('data & analytics') || 1;
        }
      }

      const result = await dataSource.query(`
        INSERT INTO listings (
          user_id, neighborhood_id, listing_type, category_id, title, description,
          price, currency, price_type, property_type, bedrooms, bathrooms,
          latitude, longitude, address, status, expires_at,
          service_type, availability_schedule, service_radius, professional_credentials,
          pricing_model, response_time, employment_type, salary_min, salary_max,
          application_deadline, required_skills, work_location, company_info,
          property_amenities, utilities_included, pet_policy, parking_spaces,
          security_features, property_size, land_size, estate_id, city, state,
          featured, boosted, verification_status, contact_preferences, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17,
          $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41, $42, $43, $44, $45
        ) RETURNING id
      `, [
        userId,
        neighborhoodId,
        listing.listingType,
        categoryId,
        listing.title,
        listing.description,
        listing.price,
        listing.currency,
        listing.priceType,
        listing.propertyType || null,
        listing.bedrooms || null,
        listing.bathrooms || null,
        listing.location.latitude,
        listing.location.longitude,
        listing.location.address,
        'active',
        null, // expires_at
        listing.serviceType || null,
        listing.availabilitySchedule ? JSON.stringify(listing.availabilitySchedule) : null,
        listing.serviceRadius || null,
        listing.professionalCredentials ? JSON.stringify(listing.professionalCredentials) : null,
        listing.pricingModel || null,
        listing.responseTime || null,
        listing.employmentType || null,
        listing.salaryMin || null,
        listing.salaryMax || null,
        listing.applicationDeadline || null,
        listing.requiredSkills ? JSON.stringify(listing.requiredSkills) : null,
        listing.workLocation || null,
        listing.companyInfo ? JSON.stringify(listing.companyInfo) : null,
        listing.propertyAmenities ? JSON.stringify(listing.propertyAmenities) : null,
        listing.utilitiesIncluded ? JSON.stringify(listing.utilitiesIncluded) : null,
        listing.petPolicy || null,
        listing.parkingSpaces || null,
        listing.securityFeatures ? JSON.stringify(listing.securityFeatures) : null,
        listing.propertySize || null,
        listing.landSize || null,
        listing.estateId || null,
        listing.city || null,
        listing.state || null,
        listing.featured || false,
        listing.boosted || false,
        listing.verificationStatus || 'pending',
        listing.contactPreferences ? JSON.stringify(listing.contactPreferences) : null,
        new Date()
      ]);

      console.log(`📝 Created listing: ${listing.title} (ID: ${result[0].id})`);
    }

    console.log('✅ Sample data seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding sample data:', error);
  } finally {
    await dataSource.destroy();
  }
}

// Run the seeder
if (require.main === module) {
  seedSampleData().catch(console.error);
}

export { seedSampleData };
