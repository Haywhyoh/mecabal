const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'homie_dev',
  user: 'homie_user',
  password: 'homiepassword',
});

async function addLocationColumn() {
  try {
    await client.connect();
    console.log('Connected to database');

    // Enable PostGIS extension
    console.log('Enabling PostGIS extension...');
    await client.query('CREATE EXTENSION IF NOT EXISTS postgis;');
    console.log('✅ PostGIS extension enabled');

    // Add location column
    console.log('Adding location column...');
    await client.query(`
      ALTER TABLE listings
      ADD COLUMN IF NOT EXISTS location GEOGRAPHY(POINT, 4326) NOT NULL DEFAULT ST_GeogFromText('SRID=4326;POINT(0 0)');
    `);
    console.log('✅ Location column added');

    // Remove default after adding column
    await client.query(`
      ALTER TABLE listings
      ALTER COLUMN location DROP DEFAULT;
    `);
    console.log('✅ Default removed from location column');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  } finally {
    await client.end();
  }
}

addLocationColumn();
