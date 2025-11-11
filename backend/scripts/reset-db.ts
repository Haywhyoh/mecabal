import { DataSource } from 'typeorm';
import ormConfig from '../ormconfig';

async function resetDatabase() {
  console.log('🔄 Connecting to database...');

  // First connection without synchronize to drop tables
  const tempConfig = {
    ...ormConfig.options,
    synchronize: false,
  };

  const dataSource = new DataSource(tempConfig);
  await dataSource.initialize();

  try {
    console.log('🗑️  Dropping all tables...');

    // Drop all tables using raw SQL (excluding PostGIS system tables)
    await dataSource.query(`
      DO $$ DECLARE
        r RECORD;
      BEGIN
        -- Drop all tables except PostGIS system tables
        FOR r IN (
          SELECT tablename
          FROM pg_tables
          WHERE schemaname = 'public'
          AND tablename NOT IN ('spatial_ref_sys', 'geography_columns', 'geometry_columns', 'raster_columns', 'raster_overviews')
        ) LOOP
          EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
        END LOOP;

        -- Drop all sequences
        FOR r IN (SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public') LOOP
          EXECUTE 'DROP SEQUENCE IF EXISTS ' || quote_ident(r.sequence_name) || ' CASCADE';
        END LOOP;

        -- Drop all types
        FOR r IN (SELECT typname FROM pg_type WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public') AND typtype = 'e') LOOP
          EXECUTE 'DROP TYPE IF EXISTS ' || quote_ident(r.typname) || ' CASCADE';
        END LOOP;
      END $$;
    `);

    console.log('✅ All tables, sequences, and types dropped');

    // Close first connection
    await dataSource.destroy();

    console.log('🔨 Creating fresh schema...');

    // Create new connection with synchronize enabled
    const newDataSource = await ormConfig.initialize();

    console.log('✅ Schema synchronized');

    await newDataSource.destroy();

    console.log('\n✅ Database reset complete! Run "npm run db:seed" to seed data.');
  } catch (error) {
    console.error('❌ Error resetting database:', error);
    throw error;
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

resetDatabase();
