import { MigrationInterface, QueryRunner } from 'typeorm';

export class M16CreateMarkbookTables1786206543420 implements MigrationInterface {
  name = 'M16CreateMarkbookTables1786206543420';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`markbook_scales\` (\`id\` varchar(36) NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` timestamp(6) NULL, \`schoolId\` varchar(36) NOT NULL, \`name\` varchar(60) NOT NULL, \`shortName\` varchar(16) NOT NULL, \`description\` text NULL, \`active\` tinyint NOT NULL DEFAULT 1, UNIQUE INDEX \`IDX_7d48dd833b32ad1ae26012a303\` (\`schoolId\`, \`shortName\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`markbook_columns\` (\`id\` varchar(36) NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` timestamp(6) NULL, \`courseClassId\` varchar(36) NOT NULL, \`name\` varchar(60) NOT NULL, \`description\` text NULL, \`sequenceNumber\` int NOT NULL DEFAULT '0', \`attainmentEnabled\` tinyint NOT NULL DEFAULT 1, \`effortEnabled\` tinyint NOT NULL DEFAULT 1, \`scaleIdAttainment\` varchar(36) NULL, \`scaleIdEffort\` varchar(36) NULL, \`rubricIdAttainment\` varchar(36) NULL, \`rubricIdEffort\` varchar(36) NULL, \`viewableStudents\` tinyint NOT NULL DEFAULT 0, \`viewableParents\` tinyint NOT NULL DEFAULT 0, \`complete\` tinyint NOT NULL DEFAULT 0, \`completeDate\` date NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`markbook_scale_grades\` (\`id\` varchar(36) NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`scaleId\` varchar(36) NOT NULL, \`name\` varchar(40) NOT NULL, \`shortName\` varchar(8) NOT NULL, \`value\` int NOT NULL, \`sequenceNumber\` int NOT NULL DEFAULT '0', \`lowestAcceptable\` tinyint NOT NULL DEFAULT 0, UNIQUE INDEX \`IDX_9fdab87e5ef9982a6ed9cc4d83\` (\`scaleId\`, \`shortName\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`markbook_entries\` (\`id\` varchar(36) NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`markbookColumnId\` varchar(36) NOT NULL, \`personId\` varchar(36) NOT NULL, \`attainmentScaleGradeId\` varchar(36) NULL, \`attainmentConcern\` varchar(1) NOT NULL DEFAULT 'N', \`effortScaleGradeId\` varchar(36) NULL, \`effortConcern\` varchar(1) NOT NULL DEFAULT 'N', \`comment\` text NULL, UNIQUE INDEX \`IDX_25bbc63d1a8ac8b1f478c01d69\` (\`markbookColumnId\`, \`personId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`markbook_targets\` (\`id\` varchar(36) NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`courseClassId\` varchar(36) NOT NULL, \`personId\` varchar(36) NOT NULL, \`targetScaleGradeId\` varchar(36) NOT NULL, UNIQUE INDEX \`IDX_bc960aa12c55598a7aa3e0bf56\` (\`courseClassId\`, \`personId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`markbook_weights\` (\`id\` varchar(36) NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`courseClassId\` varchar(36) NOT NULL, \`name\` varchar(40) NOT NULL, \`weighting\` decimal(5,2) NOT NULL, \`sequenceNumber\` int NOT NULL DEFAULT '0', UNIQUE INDEX \`IDX_38548b8bea4ab9014bb8b7d0d4\` (\`courseClassId\`, \`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`markbook_scales\` ADD CONSTRAINT \`FK_65db3af0e7aa08f649f4c2f852d\` FOREIGN KEY (\`schoolId\`) REFERENCES \`schools\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`markbook_columns\` ADD CONSTRAINT \`FK_4b666901ecef2701cd52f9486c7\` FOREIGN KEY (\`courseClassId\`) REFERENCES \`course_classes\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`markbook_columns\` ADD CONSTRAINT \`FK_4d989709a2f7446d11d6967b10c\` FOREIGN KEY (\`scaleIdAttainment\`) REFERENCES \`markbook_scales\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`markbook_columns\` ADD CONSTRAINT \`FK_37e0f38c9efc13a7e3b90a0e3d5\` FOREIGN KEY (\`scaleIdEffort\`) REFERENCES \`markbook_scales\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`markbook_scale_grades\` ADD CONSTRAINT \`FK_405dab59d28be9ac5e0dc3045fe\` FOREIGN KEY (\`scaleId\`) REFERENCES \`markbook_scales\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`markbook_entries\` ADD CONSTRAINT \`FK_ff3c694987f9e845fe132dac6cd\` FOREIGN KEY (\`markbookColumnId\`) REFERENCES \`markbook_columns\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`markbook_entries\` ADD CONSTRAINT \`FK_848d3c9704b1992e3ff85b49711\` FOREIGN KEY (\`personId\`) REFERENCES \`people\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`markbook_entries\` ADD CONSTRAINT \`FK_9aa324090fb65f7e9f402a0c8ca\` FOREIGN KEY (\`attainmentScaleGradeId\`) REFERENCES \`markbook_scale_grades\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`markbook_entries\` ADD CONSTRAINT \`FK_486706d5fe0832c03eddaa8e4a7\` FOREIGN KEY (\`effortScaleGradeId\`) REFERENCES \`markbook_scale_grades\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`markbook_targets\` ADD CONSTRAINT \`FK_e39b66ea13f15aac57bd22f5b48\` FOREIGN KEY (\`courseClassId\`) REFERENCES \`course_classes\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`markbook_targets\` ADD CONSTRAINT \`FK_3b76e10a8df57837edadfd92aa0\` FOREIGN KEY (\`personId\`) REFERENCES \`people\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`markbook_targets\` ADD CONSTRAINT \`FK_0b43c933f4ba6738c6bfcbe0a2f\` FOREIGN KEY (\`targetScaleGradeId\`) REFERENCES \`markbook_scale_grades\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`markbook_weights\` ADD CONSTRAINT \`FK_89c8af9afa1b089cdcdd63848ea\` FOREIGN KEY (\`courseClassId\`) REFERENCES \`course_classes\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`markbook_weights\` DROP FOREIGN KEY \`FK_89c8af9afa1b089cdcdd63848ea\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`markbook_targets\` DROP FOREIGN KEY \`FK_0b43c933f4ba6738c6bfcbe0a2f\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`markbook_targets\` DROP FOREIGN KEY \`FK_3b76e10a8df57837edadfd92aa0\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`markbook_targets\` DROP FOREIGN KEY \`FK_e39b66ea13f15aac57bd22f5b48\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`markbook_entries\` DROP FOREIGN KEY \`FK_486706d5fe0832c03eddaa8e4a7\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`markbook_entries\` DROP FOREIGN KEY \`FK_9aa324090fb65f7e9f402a0c8ca\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`markbook_entries\` DROP FOREIGN KEY \`FK_848d3c9704b1992e3ff85b49711\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`markbook_entries\` DROP FOREIGN KEY \`FK_ff3c694987f9e845fe132dac6cd\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`markbook_scale_grades\` DROP FOREIGN KEY \`FK_405dab59d28be9ac5e0dc3045fe\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`markbook_columns\` DROP FOREIGN KEY \`FK_37e0f38c9efc13a7e3b90a0e3d5\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`markbook_columns\` DROP FOREIGN KEY \`FK_4d989709a2f7446d11d6967b10c\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`markbook_columns\` DROP FOREIGN KEY \`FK_4b666901ecef2701cd52f9486c7\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`markbook_scales\` DROP FOREIGN KEY \`FK_65db3af0e7aa08f649f4c2f852d\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_38548b8bea4ab9014bb8b7d0d4\` ON \`markbook_weights\``,
    );
    await queryRunner.query(`DROP TABLE \`markbook_weights\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_bc960aa12c55598a7aa3e0bf56\` ON \`markbook_targets\``,
    );
    await queryRunner.query(`DROP TABLE \`markbook_targets\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_25bbc63d1a8ac8b1f478c01d69\` ON \`markbook_entries\``,
    );
    await queryRunner.query(`DROP TABLE \`markbook_entries\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_9fdab87e5ef9982a6ed9cc4d83\` ON \`markbook_scale_grades\``,
    );
    await queryRunner.query(`DROP TABLE \`markbook_scale_grades\``);
    await queryRunner.query(`DROP TABLE \`markbook_columns\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_7d48dd833b32ad1ae26012a303\` ON \`markbook_scales\``,
    );
    await queryRunner.query(`DROP TABLE \`markbook_scales\``);
  }
}
