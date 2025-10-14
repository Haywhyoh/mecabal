const { Client } = require('pg');
require('dotenv').config();

async function checkNeighborhoods() {
  const client = new Client({
    host: process.env.DATABASE_HOST || 'localhost',
    port: process.env.DATABASE_PORT || 5432,
    database: process.env.DATABASE_NAME || 'MeCabal_dev',
    user: process.env.DATABASE_USERNAME || 'MeCabal_user',
    password: process.env.DATABASE_PASSWORD || 'MeCabalpassword',
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Check neighborhoods
    const neighborhoodsResult = await client.query('SELECT id, name FROM neighborhoods LIMIT 10');
    console.log('Neighborhoods:', neighborhoodsResult.rows);

    // Check users and their neighborhoods
    const usersResult = await client.query(`
      SELECT u.id, u.email, un.neighborhood_id, n.name as neighborhood_name
      FROM users u
      LEFT JOIN user_neighborhoods un ON u.id = un.user_id
      LEFT JOIN neighborhoods n ON un.neighborhood_id = n.id
      WHERE u.id = 'a4ba9886-ce30-43ea-9ac0-7ca45e45570f'
    `);
    console.log('User neighborhoods:', usersResult.rows);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

checkNeighborhoods();
