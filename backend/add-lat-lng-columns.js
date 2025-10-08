const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'homie_dev',
  user: 'homie_user',
  password: 'homiepassword',
});

async function addLatLngColumns() {
  try {
    await client.connect();
    console.log('Connected to database');

    // Add latitude column
    console.log('Adding latitude column...');
    await client.query(`
      ALTER TABLE listings
      ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8) DEFAULT 0;
    `);
    console.log('✅ Latitude column added');

    // Add longitude column
    console.log('Adding longitude column...');
    await client.query(`
      ALTER TABLE listings
      ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8) DEFAULT 0;
    `);
    console.log('✅ Longitude column added');

    console.log('\n✅ All columns added successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

addLatLngColumns();
