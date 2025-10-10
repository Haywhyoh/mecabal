import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

export class AddCulturalProfileFieldsToUser1760103208294 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add cultural profile fields to users table
    await queryRunner.addColumns('users', [
      new TableColumn({
        name: 'state_of_origin_id',
        type: 'varchar',
        length: '50',
        isNullable: true,
      }),
      new TableColumn({
        name: 'cultural_background_id',
        type: 'varchar',
        length: '50',
        isNullable: true,
      }),
      new TableColumn({
        name: 'professional_category_id',
        type: 'uuid',
        isNullable: true,
      }),
      new TableColumn({
        name: 'professional_title',
        type: 'varchar',
        length: '100',
        isNullable: true,
      }),
    ]);

    // Add foreign key constraints
    await queryRunner.createForeignKey(
      'users',
      new TableForeignKey({
        columnNames: ['state_of_origin_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'nigerian_states',
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createForeignKey(
      'users',
      new TableForeignKey({
        columnNames: ['cultural_background_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'cultural_backgrounds',
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createForeignKey(
      'users',
      new TableForeignKey({
        columnNames: ['professional_category_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'professional_categories',
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraints
    const table = await queryRunner.getTable('users');
    if (table) {
      const foreignKeys = table.foreignKeys.filter(
        (fk) =>
          fk.columnNames.includes('state_of_origin_id') ||
          fk.columnNames.includes('cultural_background_id') ||
          fk.columnNames.includes('professional_category_id'),
      );

      for (const foreignKey of foreignKeys) {
        await queryRunner.dropForeignKey('users', foreignKey);
      }
    }

    // Drop columns
    await queryRunner.dropColumns('users', [
      'state_of_origin_id',
      'cultural_background_id',
      'professional_category_id',
      'professional_title',
    ]);
  }
}
