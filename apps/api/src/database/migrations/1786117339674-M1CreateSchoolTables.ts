import { MigrationInterface, QueryRunner } from 'typeorm';

export class M1CreateSchoolTables1786117339674 implements MigrationInterface {
  name = 'M1CreateSchoolTables1786117339674';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`schools\` (\`id\` varchar(36) NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` timestamp(6) NULL, \`name\` varchar(255) NOT NULL, \`subdomainSlug\` varchar(63) NOT NULL, \`status\` varchar(32) NOT NULL DEFAULT 'PendingVerification', \`planTier\` varchar(32) NOT NULL DEFAULT 'Free', \`dataResidencyRegion\` varchar(64) NULL, UNIQUE INDEX \`IDX_ddc2556f1f16e55a9cbed5eeaf\` (\`subdomainSlug\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`school_years\` (\`id\` varchar(36) NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` timestamp(6) NULL, \`schoolId\` varchar(36) NOT NULL, \`name\` varchar(9) NOT NULL, \`status\` varchar(16) NOT NULL DEFAULT 'Upcoming', \`sequenceNumber\` int NOT NULL, \`firstDay\` date NULL, \`lastDay\` date NULL, UNIQUE INDEX \`IDX_eff8b43acd0276d2b7aa53a3ea\` (\`schoolId\`, \`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`school_year_terms\` (\`id\` varchar(36) NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` timestamp(6) NULL, \`schoolYearId\` varchar(36) NOT NULL, \`sequenceNumber\` int NOT NULL, \`name\` varchar(20) NOT NULL, \`shortName\` varchar(4) NOT NULL, \`firstDay\` date NOT NULL, \`lastDay\` date NOT NULL, UNIQUE INDEX \`IDX_6938aed841498b2eb46b8f1203\` (\`schoolYearId\`, \`sequenceNumber\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`school_years\` ADD CONSTRAINT \`FK_ff20ead8cc1c9b610f005315cc5\` FOREIGN KEY (\`schoolId\`) REFERENCES \`schools\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`school_year_terms\` ADD CONSTRAINT \`FK_f4017cbb75fe621dda541920367\` FOREIGN KEY (\`schoolYearId\`) REFERENCES \`school_years\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`school_year_terms\` DROP FOREIGN KEY \`FK_f4017cbb75fe621dda541920367\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`school_years\` DROP FOREIGN KEY \`FK_ff20ead8cc1c9b610f005315cc5\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_6938aed841498b2eb46b8f1203\` ON \`school_year_terms\``,
    );
    await queryRunner.query(`DROP TABLE \`school_year_terms\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_eff8b43acd0276d2b7aa53a3ea\` ON \`school_years\``,
    );
    await queryRunner.query(`DROP TABLE \`school_years\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_ddc2556f1f16e55a9cbed5eeaf\` ON \`schools\``,
    );
    await queryRunner.query(`DROP TABLE \`schools\``);
  }
}
