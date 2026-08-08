import { MigrationInterface, QueryRunner } from 'typeorm';

export class M9CreateComplianceTables1786158044864 implements MigrationInterface {
  name = 'M9CreateComplianceTables1786158044864';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`audit_logs\` (\`id\` varchar(36) NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`schoolId\` varchar(36) NULL, \`actorPersonId\` varchar(36) NULL, \`action\` varchar(20) NOT NULL, \`entityName\` varchar(100) NOT NULL, \`entityId\` varchar(36) NULL, \`before\` json NULL, \`after\` json NULL, INDEX \`IDX_c0ec52f017ac513f07ee6e749e\` (\`entityName\`, \`entityId\`), INDEX \`IDX_1a42d1824a7c74ee392ed9eb30\` (\`schoolId\`, \`createdAt\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`consent_records\` (\`id\` varchar(36) NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`personId\` varchar(36) NOT NULL, \`policyVersion\` varchar(20) NOT NULL, \`acceptedAt\` timestamp NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`people\` ADD \`erasedAt\` timestamp NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`consent_records\` ADD CONSTRAINT \`FK_371d5b86364227943126599b393\` FOREIGN KEY (\`personId\`) REFERENCES \`people\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`consent_records\` DROP FOREIGN KEY \`FK_371d5b86364227943126599b393\``,
    );
    await queryRunner.query(`ALTER TABLE \`people\` DROP COLUMN \`erasedAt\``);
    await queryRunner.query(`DROP TABLE \`consent_records\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_1a42d1824a7c74ee392ed9eb30\` ON \`audit_logs\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_c0ec52f017ac513f07ee6e749e\` ON \`audit_logs\``,
    );
    await queryRunner.query(`DROP TABLE \`audit_logs\``);
  }
}
