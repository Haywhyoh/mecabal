import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateMessagingTables1760106000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create conversations table
    await queryRunner.createTable(
      new Table({
        name: 'conversations',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['direct', 'group', 'community'],
            default: "'direct'",
          },
          {
            name: 'title',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'avatar',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'context_type',
            type: 'enum',
            enum: ['event', 'business', 'listing', 'general'],
            default: "'general'",
          },
          {
            name: 'context_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'is_archived',
            type: 'boolean',
            default: false,
          },
          {
            name: 'is_pinned',
            type: 'boolean',
            default: false,
          },
          {
            name: 'last_message_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'created_by',
            type: 'uuid',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['created_by'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    // Create conversation_participants table
    await queryRunner.createTable(
      new Table({
        name: 'conversation_participants',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'conversation_id',
            type: 'uuid',
          },
          {
            name: 'user_id',
            type: 'uuid',
          },
          {
            name: 'role',
            type: 'enum',
            enum: ['admin', 'member'],
            default: "'member'",
          },
          {
            name: 'is_muted',
            type: 'boolean',
            default: false,
          },
          {
            name: 'is_pinned',
            type: 'boolean',
            default: false,
          },
          {
            name: 'last_read_message_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'last_read_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'unread_count',
            type: 'integer',
            default: 0,
          },
          {
            name: 'joined_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'left_at',
            type: 'timestamp',
            isNullable: true,
          },
        ],
        foreignKeys: [
          {
            columnNames: ['conversation_id'],
            referencedTableName: 'conversations',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['user_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    // Create messages table
    await queryRunner.createTable(
      new Table({
        name: 'messages',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'conversation_id',
            type: 'uuid',
          },
          {
            name: 'sender_id',
            type: 'uuid',
          },
          {
            name: 'content',
            type: 'text',
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['text', 'image', 'video', 'audio', 'location', 'file', 'system'],
            default: "'text'",
          },
          {
            name: 'reply_to_message_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'is_edited',
            type: 'boolean',
            default: false,
          },
          {
            name: 'edited_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'is_deleted',
            type: 'boolean',
            default: false,
          },
          {
            name: 'deleted_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['conversation_id'],
            referencedTableName: 'conversations',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['sender_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['reply_to_message_id'],
            referencedTableName: 'messages',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
          },
        ],
      }),
      true,
    );

    // Create message_receipts table
    await queryRunner.createTable(
      new Table({
        name: 'message_receipts',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'message_id',
            type: 'uuid',
          },
          {
            name: 'user_id',
            type: 'uuid',
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['sent', 'delivered', 'read'],
            default: "'sent'",
          },
          {
            name: 'timestamp',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['message_id'],
            referencedTableName: 'messages',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['user_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    // Create typing_indicators table
    await queryRunner.createTable(
      new Table({
        name: 'typing_indicators',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'conversation_id',
            type: 'uuid',
          },
          {
            name: 'user_id',
            type: 'uuid',
          },
          {
            name: 'is_typing',
            type: 'boolean',
            default: false,
          },
          {
            name: 'expires_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['conversation_id'],
            referencedTableName: 'conversations',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['user_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    // Create indexes for better performance
    await queryRunner.createIndex(
      'conversations',
      new TableIndex({
        name: 'IDX_CONVERSATIONS_TYPE',
        columnNames: ['type'],
      }),
    );

    await queryRunner.createIndex(
      'conversations',
      new TableIndex({
        name: 'IDX_CONVERSATIONS_CONTEXT',
        columnNames: ['context_type', 'context_id'],
      }),
    );

    await queryRunner.createIndex(
      'conversations',
      new TableIndex({
        name: 'IDX_CONVERSATIONS_ARCHIVED',
        columnNames: ['is_archived'],
      }),
    );

    await queryRunner.createIndex(
      'conversations',
      new TableIndex({
        name: 'IDX_CONVERSATIONS_LAST_MESSAGE',
        columnNames: ['last_message_at'],
      }),
    );

    await queryRunner.createIndex(
      'conversation_participants',
      new TableIndex({
        name: 'IDX_CONVERSATION_PARTICIPANTS_CONVERSATION',
        columnNames: ['conversation_id'],
      }),
    );

    await queryRunner.createIndex(
      'conversation_participants',
      new TableIndex({
        name: 'IDX_CONVERSATION_PARTICIPANTS_USER',
        columnNames: ['user_id'],
      }),
    );

    await queryRunner.createIndex(
      'conversation_participants',
      new TableIndex({
        name: 'IDX_CONVERSATION_PARTICIPANTS_ACTIVE',
        columnNames: ['conversation_id', 'user_id', 'left_at'],
      }),
    );

    await queryRunner.createIndex(
      'messages',
      new TableIndex({
        name: 'IDX_MESSAGES_CONVERSATION',
        columnNames: ['conversation_id'],
      }),
    );

    await queryRunner.createIndex(
      'messages',
      new TableIndex({
        name: 'IDX_MESSAGES_SENDER',
        columnNames: ['sender_id'],
      }),
    );

    await queryRunner.createIndex(
      'messages',
      new TableIndex({
        name: 'IDX_MESSAGES_CREATED_AT',
        columnNames: ['created_at'],
      }),
    );

    await queryRunner.createIndex(
      'messages',
      new TableIndex({
        name: 'IDX_MESSAGES_TYPE',
        columnNames: ['type'],
      }),
    );

    await queryRunner.createIndex(
      'messages',
      new TableIndex({
        name: 'IDX_MESSAGES_DELETED',
        columnNames: ['is_deleted'],
      }),
    );

    await queryRunner.createIndex(
      'message_receipts',
      new TableIndex({
        name: 'IDX_MESSAGE_RECEIPTS_MESSAGE',
        columnNames: ['message_id'],
      }),
    );

    await queryRunner.createIndex(
      'message_receipts',
      new TableIndex({
        name: 'IDX_MESSAGE_RECEIPTS_USER',
        columnNames: ['user_id'],
      }),
    );

    await queryRunner.createIndex(
      'message_receipts',
      new TableIndex({
        name: 'IDX_MESSAGE_RECEIPTS_STATUS',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'typing_indicators',
      new TableIndex({
        name: 'IDX_TYPING_INDICATORS_CONVERSATION',
        columnNames: ['conversation_id'],
      }),
    );

    await queryRunner.createIndex(
      'typing_indicators',
      new TableIndex({
        name: 'IDX_TYPING_INDICATORS_USER',
        columnNames: ['user_id'],
      }),
    );

    await queryRunner.createIndex(
      'typing_indicators',
      new TableIndex({
        name: 'IDX_TYPING_INDICATORS_EXPIRES',
        columnNames: ['expires_at'],
      }),
    );

    // Create unique constraints
    await queryRunner.createIndex(
      'conversation_participants',
      new TableIndex({
        name: 'UQ_CONVERSATION_PARTICIPANTS_USER_CONVERSATION',
        columnNames: ['conversation_id', 'user_id'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'message_receipts',
      new TableIndex({
        name: 'UQ_MESSAGE_RECEIPTS_USER_MESSAGE',
        columnNames: ['message_id', 'user_id'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'typing_indicators',
      new TableIndex({
        name: 'UQ_TYPING_INDICATORS_USER_CONVERSATION',
        columnNames: ['conversation_id', 'user_id'],
        isUnique: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order due to foreign key constraints
    await queryRunner.dropTable('typing_indicators');
    await queryRunner.dropTable('message_receipts');
    await queryRunner.dropTable('messages');
    await queryRunner.dropTable('conversation_participants');
    await queryRunner.dropTable('conversations');
  }
}
