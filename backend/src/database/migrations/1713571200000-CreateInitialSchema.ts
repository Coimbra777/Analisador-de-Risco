import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateInitialSchema1713571200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
            unsigned: true,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
            isUnique: true,
          },
          {
            name: 'created_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'companies',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
            unsigned: true,
          },
          {
            name: 'legal_name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'trade_name',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'registration_number',
            type: 'varchar',
            length: '50',
            isUnique: true,
          },
          {
            name: 'country',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'analyses',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
            unsigned: true,
          },
          {
            name: 'company_id',
            type: 'int',
            unsigned: true,
          },
          {
            name: 'created_by_user_id',
            type: 'int',
            unsigned: true,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['pending', 'in_progress', 'completed', 'failed'],
            default: "'pending'",
          },
          {
            name: 'risk_level',
            type: 'enum',
            enum: ['low', 'medium', 'high'],
            isNullable: true,
          },
          {
            name: 'summary_text',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'completed_at',
            type: 'datetime',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'documents',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
            unsigned: true,
          },
          {
            name: 'analysis_id',
            type: 'int',
            unsigned: true,
          },
          {
            name: 'original_filename',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'mime_type',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'storage_key',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'file_size_bytes',
            type: 'int',
            unsigned: true,
            isNullable: true,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['pending', 'available', 'failed'],
            default: "'pending'",
          },
          {
            name: 'created_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'risk_findings',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
            unsigned: true,
          },
          {
            name: 'analysis_id',
            type: 'int',
            unsigned: true,
          },
          {
            name: 'code',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'title',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'severity',
            type: 'enum',
            enum: ['low', 'medium', 'high'],
            default: "'medium'",
          },
          {
            name: 'created_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'analyses',
      new TableIndex({
        name: 'IDX_ANALYSES_COMPANY_ID',
        columnNames: ['company_id'],
      }),
    );
    await queryRunner.createIndex(
      'analyses',
      new TableIndex({
        name: 'IDX_ANALYSES_CREATED_BY_USER_ID',
        columnNames: ['created_by_user_id'],
      }),
    );
    await queryRunner.createIndex(
      'documents',
      new TableIndex({
        name: 'IDX_DOCUMENTS_ANALYSIS_ID',
        columnNames: ['analysis_id'],
      }),
    );
    await queryRunner.createIndex(
      'risk_findings',
      new TableIndex({
        name: 'IDX_RISK_FINDINGS_ANALYSIS_ID',
        columnNames: ['analysis_id'],
      }),
    );

    await queryRunner.createForeignKeys('analyses', [
      new TableForeignKey({
        name: 'FK_ANALYSES_COMPANY_ID',
        columnNames: ['company_id'],
        referencedTableName: 'companies',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
      new TableForeignKey({
        name: 'FK_ANALYSES_CREATED_BY_USER_ID',
        columnNames: ['created_by_user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    ]);

    await queryRunner.createForeignKey(
      'documents',
      new TableForeignKey({
        name: 'FK_DOCUMENTS_ANALYSIS_ID',
        columnNames: ['analysis_id'],
        referencedTableName: 'analyses',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'risk_findings',
      new TableForeignKey({
        name: 'FK_RISK_FINDINGS_ANALYSIS_ID',
        columnNames: ['analysis_id'],
        referencedTableName: 'analyses',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('risk_findings', true);
    await queryRunner.dropTable('documents', true);
    await queryRunner.dropTable('analyses', true);
    await queryRunner.dropTable('companies', true);
    await queryRunner.dropTable('users', true);
  }
}
