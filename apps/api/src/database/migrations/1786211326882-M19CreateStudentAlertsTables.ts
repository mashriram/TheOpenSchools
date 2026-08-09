import { MigrationInterface, QueryRunner } from 'typeorm';

export class M19CreateStudentAlertsTables1786211326882 implements MigrationInterface {
  name = 'M19CreateStudentAlertsTables1786211326882';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`alert_types\` (\`id\` varchar(36) NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` timestamp(6) NULL, \`schoolId\` varchar(36) NOT NULL, \`name\` varchar(60) NOT NULL, \`tag\` varchar(5) NULL, \`active\` tinyint NOT NULL DEFAULT 1, \`automatic\` tinyint NOT NULL DEFAULT 0, \`adminOnly\` tinyint NOT NULL DEFAULT 1, \`useLevels\` tinyint NOT NULL DEFAULT 1, \`type\` varchar(10) NOT NULL DEFAULT 'Additional', \`color\` varchar(10) NULL, \`colorBG\` varchar(10) NULL, \`description\` text NULL, \`thresholdLow\` int NULL, \`thresholdMed\` int NULL, \`thresholdHigh\` int NULL, \`sequenceNumber\` int NOT NULL DEFAULT '0', UNIQUE INDEX \`IDX_2124fcf288e20eeab3d87dab0b\` (\`schoolId\`, \`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`student_alerts\` (\`id\` varchar(36) NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`schoolYearId\` varchar(36) NOT NULL, \`personId\` varchar(36) NOT NULL, \`courseClassId\` varchar(36) NULL, \`alertTypeId\` varchar(36) NOT NULL, \`context\` varchar(10) NOT NULL DEFAULT 'Manual', \`status\` varchar(12) NOT NULL DEFAULT 'Pending', \`level\` varchar(10) NULL, \`dateStart\` date NULL, \`dateEnd\` date NULL, \`comment\` text NULL, \`createdByPersonId\` varchar(36) NULL, \`statusByPersonId\` varchar(36) NULL, \`notesStatus\` text NULL, \`statusAt\` timestamp NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`alert_types\` ADD CONSTRAINT \`FK_8ff20ec1ff638b6442f5f5b3e32\` FOREIGN KEY (\`schoolId\`) REFERENCES \`schools\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`student_alerts\` ADD CONSTRAINT \`FK_c54d0cf3622d7f89a19c51da64e\` FOREIGN KEY (\`schoolYearId\`) REFERENCES \`school_years\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`student_alerts\` ADD CONSTRAINT \`FK_62fe3c12e68579af450ef63bac8\` FOREIGN KEY (\`personId\`) REFERENCES \`people\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`student_alerts\` ADD CONSTRAINT \`FK_8148340788dc5e504e029d24b32\` FOREIGN KEY (\`courseClassId\`) REFERENCES \`course_classes\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`student_alerts\` ADD CONSTRAINT \`FK_d94db98db9b400877bd7d527f5d\` FOREIGN KEY (\`alertTypeId\`) REFERENCES \`alert_types\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`student_alerts\` ADD CONSTRAINT \`FK_0e323e2bf23db54b6bc059855f4\` FOREIGN KEY (\`createdByPersonId\`) REFERENCES \`people\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`student_alerts\` ADD CONSTRAINT \`FK_b9089e06c2226245e740c765ae8\` FOREIGN KEY (\`statusByPersonId\`) REFERENCES \`people\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`student_alerts\` DROP FOREIGN KEY \`FK_b9089e06c2226245e740c765ae8\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`student_alerts\` DROP FOREIGN KEY \`FK_0e323e2bf23db54b6bc059855f4\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`student_alerts\` DROP FOREIGN KEY \`FK_d94db98db9b400877bd7d527f5d\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`student_alerts\` DROP FOREIGN KEY \`FK_8148340788dc5e504e029d24b32\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`student_alerts\` DROP FOREIGN KEY \`FK_62fe3c12e68579af450ef63bac8\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`student_alerts\` DROP FOREIGN KEY \`FK_c54d0cf3622d7f89a19c51da64e\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`alert_types\` DROP FOREIGN KEY \`FK_8ff20ec1ff638b6442f5f5b3e32\``,
    );
    await queryRunner.query(`DROP TABLE \`student_alerts\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_2124fcf288e20eeab3d87dab0b\` ON \`alert_types\``,
    );
    await queryRunner.query(`DROP TABLE \`alert_types\``);
  }
}
