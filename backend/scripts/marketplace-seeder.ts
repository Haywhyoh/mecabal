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

interface CategoryData {
  name: string;
  description: string;
  listingType: 'property' | 'item' | 'service' | 'job';
  iconUrl?: string;
  colorCode?: string;
  isFeatured?: boolean;
  sortOrder?: number;
  searchKeywords?: string[];
  fieldDefinitions?: {
    required: string[];
    optional: string[];
    validation: Record<string, any>;
  };
  children?: CategoryData[];
}

const categoryData: CategoryData[] = [
  // PROPERTY CATEGORIES
  {
    name: 'Real Estate',
    description: 'Properties for sale and rent',
    listingType: 'property',
    iconUrl: '/icons/real-estate.svg',
    colorCode: '#3B82F6',
    isFeatured: true,
    sortOrder: 1,
    searchKeywords: ['house', 'apartment', 'property', 'real estate', 'home'],
    fieldDefinitions: {
      required: ['propertyType', 'bedrooms', 'bathrooms', 'price'],
      optional: ['amenities', 'utilities', 'parking', 'petPolicy'],
      validation: {
        price: { min: 0 },
        bedrooms: { min: 0, max: 20 },
        bathrooms: { min: 0, max: 20 }
      }
    },
    children: [
      {
        name: 'Apartments',
        description: 'Apartment rentals and sales',
        listingType: 'property',
        iconUrl: '/icons/apartment.svg',
        colorCode: '#3B82F6',
        sortOrder: 1,
        searchKeywords: ['apartment', 'flat', 'condo', 'studio'],
        fieldDefinitions: {
          required: ['bedrooms', 'bathrooms', 'price', 'rentalPeriod'],
          optional: ['amenities', 'utilities', 'parking', 'petPolicy', 'furnished'],
          validation: {
            price: { min: 0 },
            bedrooms: { min: 0, max: 5 },
            bathrooms: { min: 0, max: 5 }
          }
        }
      },
      {
        name: 'Houses',
        description: 'Houses for sale and rent',
        listingType: 'property',
        iconUrl: '/icons/house.svg',
        colorCode: '#10B981',
        sortOrder: 2,
        searchKeywords: ['house', 'home', 'villa', 'bungalow', 'mansion'],
        fieldDefinitions: {
          required: ['bedrooms', 'bathrooms', 'price', 'propertySize'],
          optional: ['amenities', 'utilities', 'parking', 'petPolicy', 'landSize'],
          validation: {
            price: { min: 0 },
            bedrooms: { min: 1, max: 20 },
            bathrooms: { min: 1, max: 20 },
            propertySize: { min: 0 }
          }
        }
      },
      {
        name: 'Commercial Properties',
        description: 'Office spaces, shops, and commercial buildings',
        listingType: 'property',
        iconUrl: '/icons/commercial.svg',
        colorCode: '#F59E0B',
        sortOrder: 3,
        searchKeywords: ['office', 'shop', 'commercial', 'warehouse', 'retail'],
        fieldDefinitions: {
          required: ['propertyType', 'price', 'propertySize'],
          optional: ['amenities', 'utilities', 'parking', 'accessibility'],
          validation: {
            price: { min: 0 },
            propertySize: { min: 0 }
          }
        }
      }
    ]
  },

  // ITEM CATEGORIES
  {
    name: 'Electronics',
    description: 'Electronic devices and gadgets',
    listingType: 'item',
    iconUrl: '/icons/electronics.svg',
    colorCode: '#8B5CF6',
    isFeatured: true,
    sortOrder: 2,
    searchKeywords: ['phone', 'laptop', 'computer', 'electronics', 'gadget'],
    fieldDefinitions: {
      required: ['brand', 'condition', 'price'],
      optional: ['model', 'warranty', 'accessories'],
      validation: {
        price: { min: 0 },
        condition: { enum: ['new', 'like_new', 'good', 'fair', 'poor'] }
      }
    },
    children: [
      {
        name: 'Mobile Phones',
        description: 'Smartphones and mobile devices',
        listingType: 'item',
        iconUrl: '/icons/phone.svg',
        colorCode: '#8B5CF6',
        sortOrder: 1,
        searchKeywords: ['phone', 'smartphone', 'iphone', 'android', 'mobile'],
        fieldDefinitions: {
          required: ['brand', 'model', 'condition', 'price'],
          optional: ['storage', 'color', 'warranty', 'accessories'],
          validation: {
            price: { min: 0 },
            condition: { enum: ['new', 'like_new', 'good', 'fair', 'poor'] }
          }
        }
      },
      {
        name: 'Computers & Laptops',
        description: 'Computers, laptops, and accessories',
        listingType: 'item',
        iconUrl: '/icons/laptop.svg',
        colorCode: '#06B6D4',
        sortOrder: 2,
        searchKeywords: ['laptop', 'computer', 'pc', 'macbook', 'desktop'],
        fieldDefinitions: {
          required: ['brand', 'model', 'condition', 'price'],
          optional: ['processor', 'ram', 'storage', 'warranty'],
          validation: {
            price: { min: 0 },
            condition: { enum: ['new', 'like_new', 'good', 'fair', 'poor'] }
          }
        }
      }
    ]
  },

  // SERVICE CATEGORIES
  {
    name: 'Professional Services',
    description: 'Professional and business services',
    listingType: 'service',
    iconUrl: '/icons/professional.svg',
    colorCode: '#EF4444',
    isFeatured: true,
    sortOrder: 3,
    searchKeywords: ['professional', 'service', 'business', 'consulting'],
    fieldDefinitions: {
      required: ['serviceType', 'pricingModel', 'responseTime'],
      optional: ['professionalCredentials', 'availabilitySchedule', 'serviceRadius'],
      validation: {
        responseTime: { min: 1, max: 168 }, // 1 hour to 1 week
        serviceRadius: { min: 1, max: 100 } // 1-100 km
      }
    },
    children: [
      {
        name: 'Home Services',
        description: 'Home improvement and maintenance services',
        listingType: 'service',
        iconUrl: '/icons/home-service.svg',
        colorCode: '#10B981',
        sortOrder: 1,
        searchKeywords: ['home', 'repair', 'maintenance', 'cleaning', 'plumbing'],
        fieldDefinitions: {
          required: ['serviceType', 'pricingModel', 'responseTime'],
          optional: ['professionalCredentials', 'availabilitySchedule', 'serviceRadius'],
          validation: {
            responseTime: { min: 1, max: 48 }, // 1-48 hours
            serviceRadius: { min: 1, max: 50 }
          }
        }
      },
      {
        name: 'Business Services',
        description: 'Business and professional consulting services',
        listingType: 'service',
        iconUrl: '/icons/business.svg',
        colorCode: '#3B82F6',
        sortOrder: 2,
        searchKeywords: ['business', 'consulting', 'marketing', 'accounting', 'legal'],
        fieldDefinitions: {
          required: ['serviceType', 'pricingModel', 'responseTime', 'professionalCredentials'],
          optional: ['availabilitySchedule', 'serviceRadius'],
          validation: {
            responseTime: { min: 1, max: 72 }, // 1-72 hours
            serviceRadius: { min: 1, max: 100 }
          }
        }
      },
      {
        name: 'Personal Services',
        description: 'Personal care and lifestyle services',
        listingType: 'service',
        iconUrl: '/icons/personal.svg',
        colorCode: '#F59E0B',
        sortOrder: 3,
        searchKeywords: ['personal', 'beauty', 'fitness', 'tutoring', 'coaching'],
        fieldDefinitions: {
          required: ['serviceType', 'pricingModel', 'responseTime'],
          optional: ['professionalCredentials', 'availabilitySchedule', 'serviceRadius'],
          validation: {
            responseTime: { min: 1, max: 24 }, // 1-24 hours
            serviceRadius: { min: 1, max: 30 }
          }
        }
      }
    ]
  },

  // JOB CATEGORIES
  {
    name: 'Technology Jobs',
    description: 'Technology and IT job opportunities',
    listingType: 'job',
    iconUrl: '/icons/tech-jobs.svg',
    colorCode: '#8B5CF6',
    isFeatured: true,
    sortOrder: 4,
    searchKeywords: ['tech', 'programming', 'software', 'developer', 'engineer'],
    fieldDefinitions: {
      required: ['employmentType', 'workLocation', 'salaryMin', 'salaryMax'],
      optional: ['requiredSkills', 'applicationDeadline', 'companyInfo'],
      validation: {
        salaryMin: { min: 0 },
        salaryMax: { min: 0 },
        employmentType: { enum: ['full_time', 'part_time', 'contract', 'freelance'] }
      }
    },
    children: [
      {
        name: 'Software Development',
        description: 'Software development and programming jobs',
        listingType: 'job',
        iconUrl: '/icons/software-dev.svg',
        colorCode: '#8B5CF6',
        sortOrder: 1,
        searchKeywords: ['developer', 'programmer', 'software', 'coding', 'programming'],
        fieldDefinitions: {
          required: ['employmentType', 'workLocation', 'salaryMin', 'salaryMax', 'requiredSkills'],
          optional: ['applicationDeadline', 'companyInfo'],
          validation: {
            salaryMin: { min: 0 },
            salaryMax: { min: 0 },
            requiredSkills: { minItems: 1 }
          }
        }
      },
      {
        name: 'Data & Analytics',
        description: 'Data science and analytics positions',
        listingType: 'job',
        iconUrl: '/icons/data.svg',
        colorCode: '#06B6D4',
        sortOrder: 2,
        searchKeywords: ['data', 'analytics', 'scientist', 'analyst', 'statistics'],
        fieldDefinitions: {
          required: ['employmentType', 'workLocation', 'salaryMin', 'salaryMax', 'requiredSkills'],
          optional: ['applicationDeadline', 'companyInfo'],
          validation: {
            salaryMin: { min: 0 },
            salaryMax: { min: 0 },
            requiredSkills: { minItems: 1 }
          }
        }
      }
    ]
  },

  {
    name: 'Healthcare Jobs',
    description: 'Healthcare and medical job opportunities',
    listingType: 'job',
    iconUrl: '/icons/healthcare.svg',
    colorCode: '#EF4444',
    isFeatured: true,
    sortOrder: 5,
    searchKeywords: ['healthcare', 'medical', 'doctor', 'nurse', 'health'],
    fieldDefinitions: {
      required: ['employmentType', 'workLocation', 'salaryMin', 'salaryMax'],
      optional: ['requiredSkills', 'applicationDeadline', 'companyInfo'],
      validation: {
        salaryMin: { min: 0 },
        salaryMax: { min: 0 },
        employmentType: { enum: ['full_time', 'part_time', 'contract', 'freelance'] }
      }
    },
    children: [
      {
        name: 'Medical Professionals',
        description: 'Doctor, nurse, and medical professional positions',
        listingType: 'job',
        iconUrl: '/icons/medical.svg',
        colorCode: '#EF4444',
        sortOrder: 1,
        searchKeywords: ['doctor', 'nurse', 'medical', 'physician', 'healthcare'],
        fieldDefinitions: {
          required: ['employmentType', 'workLocation', 'salaryMin', 'salaryMax', 'requiredSkills'],
          optional: ['applicationDeadline', 'companyInfo'],
          validation: {
            salaryMin: { min: 0 },
            salaryMax: { min: 0 },
            requiredSkills: { minItems: 1 }
          }
        }
      }
    ]
  }
];

async function seedCategories() {
  console.log('🌱 Starting category seeding...');
  
  try {
    await dataSource.initialize();
    console.log('✅ Database connection established');

    // Clear existing categories
    await dataSource.query('DELETE FROM listing_categories');
    console.log('🗑️ Cleared existing categories');

    // Insert categories recursively
    await insertCategoriesRecursively(dataSource, categoryData, null);
    
    console.log('✅ Category seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding categories:', error);
  } finally {
    await dataSource.destroy();
  }
}

async function insertCategoriesRecursively(
  dataSource: DataSource,
  categories: CategoryData[],
  parentId: number | null
): Promise<void> {
  for (const category of categories) {
    // Insert parent category
    const result = await dataSource.query(`
      INSERT INTO listing_categories (
        name, description, listing_type, icon_url, color_code, 
        is_featured, sort_order, search_keywords, field_definitions, parent_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id
    `, [
      category.name,
      category.description,
      category.listingType,
      category.iconUrl || null,
      category.colorCode || null,
      category.isFeatured || false,
      category.sortOrder || 0,
      category.searchKeywords ? JSON.stringify(category.searchKeywords) : null,
      category.fieldDefinitions ? JSON.stringify(category.fieldDefinitions) : null,
      parentId
    ]);

    const categoryId = result[0].id;
    console.log(`📁 Created category: ${category.name} (ID: ${categoryId})`);

    // Insert children recursively
    if (category.children && category.children.length > 0) {
      await insertCategoriesRecursively(dataSource, category.children, categoryId);
    }
  }
}

// Run the seeder
if (require.main === module) {
  seedCategories().catch(console.error);
}

export { seedCategories };
