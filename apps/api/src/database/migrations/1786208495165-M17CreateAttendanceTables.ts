import { MigrationInterface, QueryRunner } from 'typeorm';

export class M17CreateAttendanceTables1786208495165 implements MigrationInterface {
  name = 'M17CreateAttendanceTables1786208495165';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`attendance_codes\` (\`id\` varchar(36) NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` timestamp(6) NULL, \`schoolId\` varchar(36) NOT NULL, \`name\` varchar(30) NOT NULL, \`shortName\` varchar(4) NOT NULL, \`type\` varchar(10) NOT NULL DEFAULT 'Additional', \`direction\` varchar(3) NOT NULL, \`scope\` varchar(20) NOT NULL, \`active\` tinyint NOT NULL DEFAULT 1, \`reportable\` tinyint NOT NULL DEFAULT 1, \`allowFutureDate\` tinyint NOT NULL DEFAULT 0, \`prefill\` tinyint NOT NULL DEFAULT 1, \`sequenceNumber\` int NOT NULL DEFAULT '0', UNIQUE INDEX \`IDX_6d00c67644747718ca2b863d85\` (\`schoolId\`, \`shortName\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`attendance_code_roles\` (\`id\` varchar(36) NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`attendanceCodeId\` varchar(36) NOT NULL, \`roleId\` varchar(36) NOT NULL, UNIQUE INDEX \`IDX_eca4c67dd78219e019bebecdac\` (\`attendanceCodeId\`, \`roleId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`attendance_log_course_classes\` (\`id\` varchar(36) NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`courseClassId\` varchar(36) NOT NULL, \`takenByPersonId\` varchar(36) NULL, \`date\` date NOT NULL, \`takenAt\` timestamp NOT NULL, UNIQUE INDEX \`IDX_111081c5588c96040bd33af336\` (\`courseClassId\`, \`date\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`attendance_log_form_groups\` (\`id\` varchar(36) NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`formGroupId\` varchar(36) NOT NULL, \`takenByPersonId\` varchar(36) NULL, \`date\` date NOT NULL, \`takenAt\` timestamp NOT NULL, UNIQUE INDEX \`IDX_fc9d3c3ba728f202822afe184a\` (\`formGroupId\`, \`date\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`attendance_log_people\` (\`id\` varchar(36) NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`personId\` varchar(36) NOT NULL, \`attendanceCodeId\` varchar(36) NULL, \`direction\` varchar(3) NOT NULL, \`context\` varchar(20) NULL, \`reason\` varchar(30) NULL, \`comment\` varchar(255) NULL, \`date\` date NOT NULL, \`takenByPersonId\` varchar(36) NULL, \`formGroupId\` varchar(36) NULL, \`courseClassId\` varchar(36) NULL, \`takenAt\` timestamp NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`attendance_codes\` ADD CONSTRAINT \`FK_f832bae3ee027621b4c5e93f600\` FOREIGN KEY (\`schoolId\`) REFERENCES \`schools\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`attendance_code_roles\` ADD CONSTRAINT \`FK_b4735ea5914c9145d401b8730a8\` FOREIGN KEY (\`attendanceCodeId\`) REFERENCES \`attendance_codes\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`attendance_code_roles\` ADD CONSTRAINT \`FK_13ea4950b5260d179070a96e9a1\` FOREIGN KEY (\`roleId\`) REFERENCES \`rbac_roles\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`attendance_log_course_classes\` ADD CONSTRAINT \`FK_62ae6d24955fca65a9e836d4d15\` FOREIGN KEY (\`courseClassId\`) REFERENCES \`course_classes\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`attendance_log_course_classes\` ADD CONSTRAINT \`FK_3a2c800764c3ce87592885054bc\` FOREIGN KEY (\`takenByPersonId\`) REFERENCES \`people\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`attendance_log_form_groups\` ADD CONSTRAINT \`FK_6a51b25291411b1b7afeb2ee353\` FOREIGN KEY (\`formGroupId\`) REFERENCES \`form_groups\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`attendance_log_form_groups\` ADD CONSTRAINT \`FK_a1a32fb90f7f385b803afb37166\` FOREIGN KEY (\`takenByPersonId\`) REFERENCES \`people\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`attendance_log_people\` ADD CONSTRAINT \`FK_0cebbd5f4ddc3182f740130bbd1\` FOREIGN KEY (\`personId\`) REFERENCES \`people\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`attendance_log_people\` ADD CONSTRAINT \`FK_84474a2916583ac4a4463b1eaea\` FOREIGN KEY (\`attendanceCodeId\`) REFERENCES \`attendance_codes\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`attendance_log_people\` ADD CONSTRAINT \`FK_8bb6949446221029f6d8bbbd661\` FOREIGN KEY (\`takenByPersonId\`) REFERENCES \`people\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`attendance_log_people\` ADD CONSTRAINT \`FK_fdba2b0558048a9c28323b90f56\` FOREIGN KEY (\`formGroupId\`) REFERENCES \`form_groups\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`attendance_log_people\` ADD CONSTRAINT \`FK_9d58ab5b2bf6ea83a578f4c249a\` FOREIGN KEY (\`courseClassId\`) REFERENCES \`course_classes\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`attendance_log_people\` DROP FOREIGN KEY \`FK_9d58ab5b2bf6ea83a578f4c249a\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`attendance_log_people\` DROP FOREIGN KEY \`FK_fdba2b0558048a9c28323b90f56\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`attendance_log_people\` DROP FOREIGN KEY \`FK_8bb6949446221029f6d8bbbd661\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`attendance_log_people\` DROP FOREIGN KEY \`FK_84474a2916583ac4a4463b1eaea\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`attendance_log_people\` DROP FOREIGN KEY \`FK_0cebbd5f4ddc3182f740130bbd1\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`attendance_log_form_groups\` DROP FOREIGN KEY \`FK_a1a32fb90f7f385b803afb37166\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`attendance_log_form_groups\` DROP FOREIGN KEY \`FK_6a51b25291411b1b7afeb2ee353\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`attendance_log_course_classes\` DROP FOREIGN KEY \`FK_3a2c800764c3ce87592885054bc\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`attendance_log_course_classes\` DROP FOREIGN KEY \`FK_62ae6d24955fca65a9e836d4d15\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`attendance_code_roles\` DROP FOREIGN KEY \`FK_13ea4950b5260d179070a96e9a1\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`attendance_code_roles\` DROP FOREIGN KEY \`FK_b4735ea5914c9145d401b8730a8\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`attendance_codes\` DROP FOREIGN KEY \`FK_f832bae3ee027621b4c5e93f600\``,
    );
    await queryRunner.query(`DROP TABLE \`attendance_log_people\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_fc9d3c3ba728f202822afe184a\` ON \`attendance_log_form_groups\``,
    );
    await queryRunner.query(`DROP TABLE \`attendance_log_form_groups\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_111081c5588c96040bd33af336\` ON \`attendance_log_course_classes\``,
    );
    await queryRunner.query(`DROP TABLE \`attendance_log_course_classes\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_eca4c67dd78219e019bebecdac\` ON \`attendance_code_roles\``,
    );
    await queryRunner.query(`DROP TABLE \`attendance_code_roles\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_6d00c67644747718ca2b863d85\` ON \`attendance_codes\``,
    );
    await queryRunner.query(`DROP TABLE \`attendance_codes\``);
  }
}
