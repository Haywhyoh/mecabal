import { seedCategories } from './marketplace-seeder';
import { seedSampleData } from './sample-data-seeder';

async function runAllSeeders() {
  console.log('🚀 Starting Marketplace Data Seeding...\n');

  try {
    // Step 1: Seed Categories
    console.log('Step 1: Seeding Categories');
    console.log('========================');
    await seedCategories();
    console.log('');

    // Step 2: Seed Sample Data
    console.log('Step 2: Seeding Sample Data');
    console.log('===========================');
    await seedSampleData();
    console.log('');

    console.log('🎉 All seeding completed successfully!');
    console.log('');
    console.log('📊 Summary:');
    console.log('- ✅ Categories seeded with hierarchy and field definitions');
    console.log('- ✅ Sample listings created for all listing types');
    console.log('- ✅ Sample data includes properties, items, services, and jobs');
    console.log('- ✅ All data includes proper validation and relationships');
    console.log('');
    console.log('🔗 You can now test the marketplace APIs with this sample data!');

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
}

// Run all seeders
if (require.main === module) {
  runAllSeeders().catch(console.error);
}

export { runAllSeeders };
