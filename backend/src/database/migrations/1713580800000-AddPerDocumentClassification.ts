import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class AddPerDocumentClassification1713580800000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('documents', [
      new TableColumn({
        name: 'extracted_text',
        type: 'longtext',
        isNullable: true,
      }),
      new TableColumn({
        name: 'summary_text',
        type: 'text',
        isNullable: true,
      }),
      new TableColumn({
        name: 'risk_level',
        type: 'enum',
        enum: ['low', 'medium', 'high'],
        isNullable: true,
      }),
    ]);

    await queryRunner.addColumn(
      'risk_findings',
      new TableColumn({
        name: 'document_id',
        type: 'int',
        unsigned: true,
        isNullable: true,
      }),
    );

    await queryRunner.query(`
      UPDATE risk_findings rf
      INNER JOIN (
        SELECT analysis_id, MIN(id) AS doc_id
        FROM documents
        GROUP BY analysis_id
      ) d ON d.analysis_id = rf.analysis_id
      SET rf.document_id = d.doc_id
      WHERE rf.document_id IS NULL
    `);

    await queryRunner.query(`
      DELETE FROM risk_findings WHERE document_id IS NULL
    `);

    await queryRunner.query(
      'ALTER TABLE `risk_findings` MODIFY `document_id` int UNSIGNED NOT NULL',
    );

    await queryRunner.createIndex(
      'risk_findings',
      new TableIndex({
        name: 'IDX_RISK_FINDINGS_DOCUMENT_ID',
        columnNames: ['document_id'],
      }),
    );

    await queryRunner.createForeignKey(
      'risk_findings',
      new TableForeignKey({
        name: 'FK_RISK_FINDINGS_DOCUMENT_ID',
        columnNames: ['document_id'],
        referencedTableName: 'documents',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey(
      'risk_findings',
      'FK_RISK_FINDINGS_DOCUMENT_ID',
    );
    await queryRunner.dropIndex(
      'risk_findings',
      'IDX_RISK_FINDINGS_DOCUMENT_ID',
    );
    await queryRunner.dropColumn('risk_findings', 'document_id');
    await queryRunner.dropColumn('documents', 'risk_level');
    await queryRunner.dropColumn('documents', 'summary_text');
    await queryRunner.dropColumn('documents', 'extracted_text');
  }
}
