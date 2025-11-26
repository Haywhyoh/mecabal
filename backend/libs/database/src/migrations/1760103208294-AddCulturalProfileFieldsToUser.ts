import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

export class AddCulturalProfileFieldsToUser1760103208294 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if columns already exist
    const columnsToAdd: TableColumn[] = [];
    
    const stateOfOriginExists = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'state_of_origin_id'
    `);
    
    const culturalBackgroundExists = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'cultural_background_id'
    `);
    
    const professionalCategoryExists = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'professional_category_id'
    `);
    
    const professionalTitleExists = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'professional_title'
    `);

    // Add columns that don't exist
    if (!stateOfOriginExists || stateOfOriginExists.length === 0) {
      columnsToAdd.push(
        new TableColumn({
          name: 'state_of_origin_id',
          type: 'varchar',
          length: '50',
          isNullable: true,
        })
      );
    }

    if (!culturalBackgroundExists || culturalBackgroundExists.length === 0) {
      columnsToAdd.push(
        new TableColumn({
          name: 'cultural_background_id',
          type: 'varchar',
          length: '50',
          isNullable: true,
        })
      );
    }

    if (!professionalCategoryExists || professionalCategoryExists.length === 0) {
      columnsToAdd.push(
        new TableColumn({
          name: 'professional_category_id',
          type: 'uuid',
          isNullable: true,
        })
      );
    }

    if (!professionalTitleExists || professionalTitleExists.length === 0) {
      columnsToAdd.push(
        new TableColumn({
          name: 'professional_title',
          type: 'varchar',
          length: '100',
          isNullable: true,
        })
      );
    }

    // Add columns if any need to be added
    if (columnsToAdd.length > 0) {
      await queryRunner.addColumns('users', columnsToAdd);
    }

    // Add foreign key constraints with exception handling
    // Check if columns exist (either already existed or were just added)
    const stateOfOriginColumnExists = (stateOfOriginExists && stateOfOriginExists.length > 0) || columnsToAdd.some(c => c.name === 'state_of_origin_id');
    const culturalBackgroundColumnExists = (culturalBackgroundExists && culturalBackgroundExists.length > 0) || columnsToAdd.some(c => c.name === 'cultural_background_id');
    const professionalCategoryColumnExists = (professionalCategoryExists && professionalCategoryExists.length > 0) || columnsToAdd.some(c => c.name === 'professional_category_id');

    // Check if referenced tables exist before adding foreign keys
    const nigerianStatesExists = await queryRunner.hasTable('nigerian_states');
    const culturalBackgroundsExists = await queryRunner.hasTable('cultural_backgrounds');
    const professionalCategoriesExists = await queryRunner.hasTable('professional_categories');

    if (stateOfOriginColumnExists && nigerianStatesExists) {
      await queryRunner.query(`
        DO $$ BEGIN
          ALTER TABLE "users" 
          ADD CONSTRAINT "FK_users_state_of_origin" 
          FOREIGN KEY ("state_of_origin_id") 
          REFERENCES "nigerian_states"("id") 
          ON DELETE SET NULL;
        EXCEPTION
          WHEN duplicate_object THEN null;
          WHEN OTHERS THEN
            RAISE NOTICE 'Could not add FK_users_state_of_origin: %', SQLERRM;
        END $$;
      `);
    }

    if (culturalBackgroundColumnExists && culturalBackgroundsExists) {
      await queryRunner.query(`
        DO $$ BEGIN
          ALTER TABLE "users" 
          ADD CONSTRAINT "FK_users_cultural_background" 
          FOREIGN KEY ("cultural_background_id") 
          REFERENCES "cultural_backgrounds"("id") 
          ON DELETE SET NULL;
        EXCEPTION
          WHEN duplicate_object THEN null;
          WHEN OTHERS THEN
            RAISE NOTICE 'Could not add FK_users_cultural_background: %', SQLERRM;
        END $$;
      `);
    }

    if (professionalCategoryColumnExists && professionalCategoriesExists) {
      await queryRunner.query(`
        DO $$ BEGIN
          ALTER TABLE "users" 
          ADD CONSTRAINT "FK_users_professional_category" 
          FOREIGN KEY ("professional_category_id") 
          REFERENCES "professional_categories"("id") 
          ON DELETE SET NULL;
        EXCEPTION
          WHEN duplicate_object THEN null;
          WHEN OTHERS THEN
            RAISE NOTICE 'Could not add FK_users_professional_category: %', SQLERRM;
        END $$;
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraints
    await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "FK_users_state_of_origin"`);
    await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "FK_users_cultural_background"`);
    await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "FK_users_professional_category"`);

    // Drop columns if they exist
    const columnsToDrop: string[] = [];
    
    const stateOfOriginExists = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'state_of_origin_id'
    `);
    
    const culturalBackgroundExists = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'cultural_background_id'
    `);
    
    const professionalCategoryExists = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'professional_category_id'
    `);
    
    const professionalTitleExists = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'professional_title'
    `);

    if (stateOfOriginExists && stateOfOriginExists.length > 0) {
      columnsToDrop.push('state_of_origin_id');
    }
    if (culturalBackgroundExists && culturalBackgroundExists.length > 0) {
      columnsToDrop.push('cultural_background_id');
    }
    if (professionalCategoryExists && professionalCategoryExists.length > 0) {
      columnsToDrop.push('professional_category_id');
    }
    if (professionalTitleExists && professionalTitleExists.length > 0) {
      columnsToDrop.push('professional_title');
    }

    if (columnsToDrop.length > 0) {
      await queryRunner.dropColumns('users', columnsToDrop);
    }
  }
}
