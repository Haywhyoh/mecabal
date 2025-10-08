const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'homie_dev',
  user: 'homie_user',
  password: 'homiepassword',
});

async function seedCategories() {
  try {
    await client.connect();
    console.log('Connected to database');

    const result = await client.query(`
      INSERT INTO listing_categories (listing_type, name, icon_url, color_code, display_order) VALUES
      ('property', 'Apartment', 'apartment', '#FF6B35', 1),
      ('property', 'House', 'home', '#FF6B35', 2),
      ('property', 'Land', 'terrain', '#228B22', 3),
      ('property', 'Office Space', 'office-building', '#0066CC', 4),
      ('item', 'Electronics', 'laptop', '#3498db', 10),
      ('item', 'Furniture', 'sofa', '#e74c3c', 11),
      ('item', 'Vehicles', 'car', '#f39c12', 12),
      ('item', 'Fashion', 'tshirt-crew', '#9b59b6', 13),
      ('item', 'Home & Garden', 'home-variant', '#16a085', 14),
      ('service', 'Plumbing', 'pipe-wrench', '#2ecc71', 20),
      ('service', 'Electrical', 'lightning-bolt', '#f1c40f', 21),
      ('service', 'Cleaning', 'spray-bottle', '#3498db', 22),
      ('service', 'Security', 'shield-account', '#e74c3c', 23),
      ('service', 'Repairs', 'tools', '#95a5a6', 24)
      ON CONFLICT DO NOTHING
    `);

    console.log('✅ Categories seeded successfully!');
    console.log(`Inserted ${result.rowCount} rows`);

  } catch (error) {
    console.error('❌ Error seeding categories:', error.message);
  } finally {
    await client.end();
  }
}

seedCategories();
