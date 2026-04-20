import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
  TableIndex,
} from "typeorm";

export class AddCompanyOwnership1713578400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      "companies",
      new TableColumn({
        name: "created_by_user_id",
        type: "int",
        unsigned: true,
        isNullable: true,
      }),
    );

    await queryRunner.query(`
      UPDATE companies company
      LEFT JOIN (
        SELECT company_id, MIN(created_by_user_id) AS created_by_user_id
        FROM analyses
        GROUP BY company_id
      ) analysis_owner ON analysis_owner.company_id = company.id
      SET company.created_by_user_id = analysis_owner.created_by_user_id
      WHERE company.created_by_user_id IS NULL
    `);

    const [firstUser] = await queryRunner.query(`
      SELECT id
      FROM users
      ORDER BY id ASC
      LIMIT 1
    `);

    if (firstUser) {
      await queryRunner.query(`
        UPDATE companies
        SET created_by_user_id = ${Number(firstUser.id)}
        WHERE created_by_user_id IS NULL
      `);
    } else {
      const [companiesCountRow] = await queryRunner.query(`
        SELECT COUNT(*) AS count
        FROM companies
      `);

      if (Number(companiesCountRow?.count ?? 0) > 0) {
        throw new Error(
          "Cannot add company ownership because there are companies but no users to assign them to.",
        );
      }
    }

    await queryRunner.changeColumn(
      "companies",
      "created_by_user_id",
      new TableColumn({
        name: "created_by_user_id",
        type: "int",
        unsigned: true,
        isNullable: false,
      }),
    );

    const companiesTable = await queryRunner.getTable("companies");

    if (!companiesTable) {
      throw new Error('Table "companies" was not found.');
    }

    const singleRegistrationUnique = companiesTable.uniques.find(
      (unique) =>
        unique.columnNames.length === 1 &&
        unique.columnNames[0] === "registration_number",
    );

    if (singleRegistrationUnique) {
      await queryRunner.dropUniqueConstraint("companies", singleRegistrationUnique);
    }

    const singleRegistrationIndex = companiesTable.indices.find(
      (index) =>
        index.isUnique &&
        index.columnNames.length === 1 &&
        index.columnNames[0] === "registration_number",
    );

    if (singleRegistrationIndex) {
      await queryRunner.dropIndex("companies", singleRegistrationIndex);
    }

    await queryRunner.createIndex(
      "companies",
      new TableIndex({
        name: "IDX_COMPANIES_CREATED_BY_USER_ID",
        columnNames: ["created_by_user_id"],
      }),
    );

    await queryRunner.createIndex(
      "companies",
      new TableIndex({
        name: "UQ_COMPANIES_USER_REGISTRATION_NUMBER",
        columnNames: ["created_by_user_id", "registration_number"],
        isUnique: true,
      }),
    );

    await queryRunner.createForeignKey(
      "companies",
      new TableForeignKey({
        name: "FK_COMPANIES_CREATED_BY_USER_ID",
        columnNames: ["created_by_user_id"],
        referencedTableName: "users",
        referencedColumnNames: ["id"],
        onDelete: "RESTRICT",
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey(
      "companies",
      "FK_COMPANIES_CREATED_BY_USER_ID",
    );
    await queryRunner.dropIndex(
      "companies",
      "UQ_COMPANIES_USER_REGISTRATION_NUMBER",
    );
    await queryRunner.dropIndex("companies", "IDX_COMPANIES_CREATED_BY_USER_ID");

    await queryRunner.createIndex(
      "companies",
      new TableIndex({
        name: "UQ_COMPANIES_REGISTRATION_NUMBER",
        columnNames: ["registration_number"],
        isUnique: true,
      }),
    );

    await queryRunner.dropColumn("companies", "created_by_user_id");
  }
}
