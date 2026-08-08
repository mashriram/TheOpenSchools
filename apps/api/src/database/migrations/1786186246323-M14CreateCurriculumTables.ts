import { MigrationInterface, QueryRunner } from 'typeorm';

export class M14CreateCurriculumTables1786186246323 implements MigrationInterface {
  name = 'M14CreateCurriculumTables1786186246323';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`courses\` (\`id\` varchar(36) NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` timestamp(6) NULL, \`schoolId\` varchar(36) NOT NULL, \`schoolYearId\` varchar(36) NOT NULL, \`departmentId\` varchar(36) NULL, \`name\` varchar(60) NOT NULL, \`shortName\` varchar(16) NOT NULL, \`description\` text NULL, \`includeInCurriculumMaps\` tinyint NOT NULL DEFAULT 1, \`sequenceNumber\` int NOT NULL DEFAULT '0', \`customFields\` json NULL, UNIQUE INDEX \`IDX_3096736033c4773cf8579d0b3a\` (\`schoolId\`, \`schoolYearId\`, \`shortName\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`course_classes\` (\`id\` varchar(36) NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` timestamp(6) NULL, \`courseId\` varchar(36) NOT NULL, \`name\` varchar(30) NOT NULL, \`shortName\` varchar(16) NOT NULL, \`reportable\` tinyint NOT NULL DEFAULT 1, \`takesAttendance\` tinyint NOT NULL DEFAULT 1, \`enrolmentMin\` int NULL, \`enrolmentMax\` int NULL, \`customFields\` json NULL, UNIQUE INDEX \`IDX_7b6da7cff836ed3777d37f40f6\` (\`courseId\`, \`shortName\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`course_class_people\` (\`id\` varchar(36) NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`courseClassId\` varchar(36) NOT NULL, \`personId\` varchar(36) NOT NULL, \`role\` varchar(20) NOT NULL, \`dateEnrolled\` date NULL, \`dateUnenrolled\` date NULL, \`reportable\` tinyint NOT NULL DEFAULT 1, UNIQUE INDEX \`IDX_c99a6356a506ccb080f280fa8d\` (\`courseClassId\`, \`personId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`course_year_groups\` (\`id\` varchar(36) NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`courseId\` varchar(36) NOT NULL, \`yearGroupId\` varchar(36) NOT NULL, UNIQUE INDEX \`IDX_6e3d71845f72a66370f9c8f78d\` (\`courseId\`, \`yearGroupId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`units\` (\`id\` varchar(36) NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` timestamp(6) NULL, \`courseId\` varchar(36) NOT NULL, \`name\` varchar(40) NOT NULL, \`active\` tinyint NOT NULL DEFAULT 1, \`description\` text NULL, \`sequenceNumber\` int NOT NULL DEFAULT '0', \`customFields\` json NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`courses\` ADD CONSTRAINT \`FK_9689700fc21294dc6abbb0e3180\` FOREIGN KEY (\`schoolId\`) REFERENCES \`schools\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`courses\` ADD CONSTRAINT \`FK_814399491767fcce624c9d7445d\` FOREIGN KEY (\`schoolYearId\`) REFERENCES \`school_years\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`courses\` ADD CONSTRAINT \`FK_2a26294560102d94bc4c67ecfe5\` FOREIGN KEY (\`departmentId\`) REFERENCES \`departments\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`course_classes\` ADD CONSTRAINT \`FK_544fb0b514e25450ff04f454a92\` FOREIGN KEY (\`courseId\`) REFERENCES \`courses\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`course_class_people\` ADD CONSTRAINT \`FK_d152d343fbe86219ad9bc94ed63\` FOREIGN KEY (\`courseClassId\`) REFERENCES \`course_classes\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`course_class_people\` ADD CONSTRAINT \`FK_428534eaa4284d44449811a92c3\` FOREIGN KEY (\`personId\`) REFERENCES \`people\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`course_year_groups\` ADD CONSTRAINT \`FK_6a8f2ba936d8f35d7a915a74a7f\` FOREIGN KEY (\`courseId\`) REFERENCES \`courses\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`course_year_groups\` ADD CONSTRAINT \`FK_9cc23f337a01f3fbb30e4bddc7a\` FOREIGN KEY (\`yearGroupId\`) REFERENCES \`year_groups\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`units\` ADD CONSTRAINT \`FK_488039d526ad82da05a60e93556\` FOREIGN KEY (\`courseId\`) REFERENCES \`courses\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`units\` DROP FOREIGN KEY \`FK_488039d526ad82da05a60e93556\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`course_year_groups\` DROP FOREIGN KEY \`FK_9cc23f337a01f3fbb30e4bddc7a\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`course_year_groups\` DROP FOREIGN KEY \`FK_6a8f2ba936d8f35d7a915a74a7f\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`course_class_people\` DROP FOREIGN KEY \`FK_428534eaa4284d44449811a92c3\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`course_class_people\` DROP FOREIGN KEY \`FK_d152d343fbe86219ad9bc94ed63\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`course_classes\` DROP FOREIGN KEY \`FK_544fb0b514e25450ff04f454a92\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`courses\` DROP FOREIGN KEY \`FK_2a26294560102d94bc4c67ecfe5\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`courses\` DROP FOREIGN KEY \`FK_814399491767fcce624c9d7445d\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`courses\` DROP FOREIGN KEY \`FK_9689700fc21294dc6abbb0e3180\``,
    );
    await queryRunner.query(`DROP TABLE \`units\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_6e3d71845f72a66370f9c8f78d\` ON \`course_year_groups\``,
    );
    await queryRunner.query(`DROP TABLE \`course_year_groups\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_c99a6356a506ccb080f280fa8d\` ON \`course_class_people\``,
    );
    await queryRunner.query(`DROP TABLE \`course_class_people\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_7b6da7cff836ed3777d37f40f6\` ON \`course_classes\``,
    );
    await queryRunner.query(`DROP TABLE \`course_classes\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_3096736033c4773cf8579d0b3a\` ON \`courses\``,
    );
    await queryRunner.query(`DROP TABLE \`courses\``);
  }
}
