import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddHelpAndListings20251007133042 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Add help to post_type enum
    await queryRunner.query(`
      ALTER TYPE post_type_enum ADD VALUE IF NOT EXISTS 'help';
    `);

    // 2. Add help metadata columns to posts
    await queryRunner.query(`
      ALTER TABLE posts
      ADD COLUMN IF NOT EXISTS help_category VARCHAR(50),
      ADD COLUMN IF NOT EXISTS urgency VARCHAR(20),
      ADD COLUMN IF NOT EXISTS budget VARCHAR(100),
      ADD COLUMN IF NOT EXISTS deadline TIMESTAMP;
    `);

    // 3. Create listing_categories table
    await queryRunner.query(`
      CREATE TABLE listing_categories (
        id SERIAL PRIMARY KEY,
        listing_type VARCHAR(20) NOT NULL,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        icon_url TEXT,
        color_code VARCHAR(7),
        display_order INT DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. Create listings table
    await queryRunner.query(`
      CREATE TABLE listings (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        neighborhood_id UUID NOT NULL REFERENCES neighborhoods(id),
        listing_type VARCHAR(20) NOT NULL,
        category_id INT NOT NULL REFERENCES listing_categories(id),
        title VARCHAR(200) NOT NULL,
        description TEXT NOT NULL,
        price DECIMAL(12, 2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'NGN',
        price_type VARCHAR(20) NOT NULL,
        property_type VARCHAR(20),
        bedrooms INT,
        bathrooms INT,
        rental_period VARCHAR(20),
        condition VARCHAR(20),
        brand VARCHAR(100),
        location GEOGRAPHY(POINT, 4326) NOT NULL,
        address TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'active',
        views_count INT DEFAULT 0,
        saves_count INT DEFAULT 0,
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 5. Create listing_media table
    await queryRunner.query(`
      CREATE TABLE listing_media (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
        url TEXT NOT NULL,
        type VARCHAR(10) NOT NULL,
        caption TEXT,
        display_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 6. Create listing_saves table
    await queryRunner.query(`
      CREATE TABLE listing_saves (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(listing_id, user_id)
      );
    `);

    // 7. Create indexes
    await queryRunner.query(`
      CREATE INDEX idx_listings_neighborhood ON listings(neighborhood_id);
      CREATE INDEX idx_listings_user ON listings(user_id);
      CREATE INDEX idx_listings_type ON listings(listing_type);
      CREATE INDEX idx_listings_category ON listings(category_id);
      CREATE INDEX idx_listings_status ON listings(status);
      CREATE INDEX idx_listings_location ON listings USING GIST(location);
      CREATE INDEX idx_listing_media_listing ON listing_media(listing_id);
      CREATE INDEX idx_posts_type ON posts(post_type);
    `);

    // 8. Seed listing categories
    await queryRunner.query(`
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
      ('service', 'Repairs', 'tools', '#95a5a6', 24);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop in reverse order
    await queryRunner.query(`DROP TABLE IF EXISTS listing_saves CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS listing_media CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS listings CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS listing_categories CASCADE;`);

    await queryRunner.query(`
      ALTER TABLE posts
      DROP COLUMN IF EXISTS help_category,
      DROP COLUMN IF EXISTS urgency,
      DROP COLUMN IF EXISTS budget,
      DROP COLUMN IF EXISTS deadline;
    `);

    // Note: We cannot easily remove enum values in PostgreSQL
    // The 'help' value will remain in the post_type_enum
    // This is generally acceptable as it doesn't cause issues
  }
}
