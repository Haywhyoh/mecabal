const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'homie_dev',
  user: 'homie_user',
  password: 'homiepassword',
});

async function checkTable() {
  try {
    await client.connect();
    console.log('Connected to database');

    // Check if listings table exists
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'listings'
      );
    `);

    console.log('Listings table exists:', tableExists.rows[0].exists);

    if (tableExists.rows[0].exists) {
      // Get columns
      const columns = await client.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'listings'
        ORDER BY ordinal_position;
      `);

      console.log('\nColumns in listings table:');
      columns.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkTable();
