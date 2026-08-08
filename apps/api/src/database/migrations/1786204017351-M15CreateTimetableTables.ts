import { MigrationInterface, QueryRunner } from 'typeorm';

export class M15CreateTimetableTables1786204017351 implements MigrationInterface {
  name = 'M15CreateTimetableTables1786204017351';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`facility_bookings\` (\`id\` varchar(36) NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` timestamp(6) NULL, \`spaceId\` varchar(36) NOT NULL, \`personId\` varchar(36) NOT NULL, \`date\` date NOT NULL, \`timeStart\` time NOT NULL, \`timeEnd\` time NOT NULL, \`reason\` varchar(255) NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`timetable_columns\` (\`id\` varchar(36) NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` timestamp(6) NULL, \`schoolId\` varchar(36) NOT NULL, \`name\` varchar(30) NOT NULL, \`shortName\` varchar(12) NOT NULL, UNIQUE INDEX \`IDX_0b847da0148c5af4b8a5a6dab6\` (\`schoolId\`, \`shortName\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`timetable_column_rows\` (\`id\` varchar(36) NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`timetableColumnId\` varchar(36) NOT NULL, \`name\` varchar(12) NOT NULL, \`shortName\` varchar(4) NOT NULL, \`timeStart\` time NOT NULL, \`timeEnd\` time NOT NULL, \`type\` varchar(20) NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`timetables\` (\`id\` varchar(36) NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` timestamp(6) NULL, \`schoolId\` varchar(36) NOT NULL, \`schoolYearId\` varchar(36) NOT NULL, \`name\` varchar(30) NOT NULL, \`shortName\` varchar(12) NOT NULL, \`active\` tinyint NOT NULL DEFAULT 1, UNIQUE INDEX \`IDX_b0c9e48988efbc6bd31b90f34d\` (\`schoolId\`, \`schoolYearId\`, \`shortName\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`timetable_days\` (\`id\` varchar(36) NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`timetableId\` varchar(36) NOT NULL, \`timetableColumnId\` varchar(36) NOT NULL, \`name\` varchar(12) NOT NULL, \`shortName\` varchar(4) NOT NULL, \`color\` varchar(7) NOT NULL, \`fontColor\` varchar(7) NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`timetable_day_dates\` (\`id\` varchar(36) NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`timetableDayId\` varchar(36) NOT NULL, \`date\` date NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`timetable_day_row_classes\` (\`id\` varchar(36) NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`timetableColumnRowId\` varchar(36) NOT NULL, \`timetableDayId\` varchar(36) NOT NULL, \`courseClassId\` varchar(36) NOT NULL, \`spaceId\` varchar(36) NULL, UNIQUE INDEX \`IDX_d8a77be0bb310a5607f83c4a96\` (\`timetableColumnRowId\`, \`timetableDayId\`, \`courseClassId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`timetable_year_groups\` (\`id\` varchar(36) NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`timetableId\` varchar(36) NOT NULL, \`yearGroupId\` varchar(36) NOT NULL, UNIQUE INDEX \`IDX_bfa0c0ea9917eafebd29ef89a8\` (\`timetableId\`, \`yearGroupId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`facility_bookings\` ADD CONSTRAINT \`FK_8e03e9ef8e35888f35b685925bc\` FOREIGN KEY (\`spaceId\`) REFERENCES \`spaces\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`facility_bookings\` ADD CONSTRAINT \`FK_7bd14fb58520a9506d5639be5dd\` FOREIGN KEY (\`personId\`) REFERENCES \`people\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`timetable_columns\` ADD CONSTRAINT \`FK_a81f6ad1f040a599425349f121b\` FOREIGN KEY (\`schoolId\`) REFERENCES \`schools\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`timetable_column_rows\` ADD CONSTRAINT \`FK_7d7cf37ed738b70a9b359a6d9d0\` FOREIGN KEY (\`timetableColumnId\`) REFERENCES \`timetable_columns\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`timetables\` ADD CONSTRAINT \`FK_1ffb9fd15393cd07df02062285b\` FOREIGN KEY (\`schoolId\`) REFERENCES \`schools\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`timetables\` ADD CONSTRAINT \`FK_8f9b05ccb220272e8177a218053\` FOREIGN KEY (\`schoolYearId\`) REFERENCES \`school_years\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`timetable_days\` ADD CONSTRAINT \`FK_310dfcb7c9322ee03d141cec7f1\` FOREIGN KEY (\`timetableId\`) REFERENCES \`timetables\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`timetable_days\` ADD CONSTRAINT \`FK_f68d50e905ddf4db310037bad07\` FOREIGN KEY (\`timetableColumnId\`) REFERENCES \`timetable_columns\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`timetable_day_dates\` ADD CONSTRAINT \`FK_c93c76303238f1562683be014cf\` FOREIGN KEY (\`timetableDayId\`) REFERENCES \`timetable_days\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`timetable_day_row_classes\` ADD CONSTRAINT \`FK_190a10fdc1486a3647de296e09c\` FOREIGN KEY (\`timetableColumnRowId\`) REFERENCES \`timetable_column_rows\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`timetable_day_row_classes\` ADD CONSTRAINT \`FK_01c676b4ba5c88052baa06f99b6\` FOREIGN KEY (\`timetableDayId\`) REFERENCES \`timetable_days\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`timetable_day_row_classes\` ADD CONSTRAINT \`FK_55649d13cfa3550317073ab10a8\` FOREIGN KEY (\`courseClassId\`) REFERENCES \`course_classes\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`timetable_day_row_classes\` ADD CONSTRAINT \`FK_a63a41318a0f1f11283cd6b05a8\` FOREIGN KEY (\`spaceId\`) REFERENCES \`spaces\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`timetable_year_groups\` ADD CONSTRAINT \`FK_69bec110ca5269cc18aa338bc58\` FOREIGN KEY (\`timetableId\`) REFERENCES \`timetables\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`timetable_year_groups\` ADD CONSTRAINT \`FK_d3aaa61c971bfe9d39ad32eb041\` FOREIGN KEY (\`yearGroupId\`) REFERENCES \`year_groups\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`timetable_year_groups\` DROP FOREIGN KEY \`FK_d3aaa61c971bfe9d39ad32eb041\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`timetable_year_groups\` DROP FOREIGN KEY \`FK_69bec110ca5269cc18aa338bc58\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`timetable_day_row_classes\` DROP FOREIGN KEY \`FK_a63a41318a0f1f11283cd6b05a8\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`timetable_day_row_classes\` DROP FOREIGN KEY \`FK_55649d13cfa3550317073ab10a8\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`timetable_day_row_classes\` DROP FOREIGN KEY \`FK_01c676b4ba5c88052baa06f99b6\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`timetable_day_row_classes\` DROP FOREIGN KEY \`FK_190a10fdc1486a3647de296e09c\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`timetable_day_dates\` DROP FOREIGN KEY \`FK_c93c76303238f1562683be014cf\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`timetable_days\` DROP FOREIGN KEY \`FK_f68d50e905ddf4db310037bad07\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`timetable_days\` DROP FOREIGN KEY \`FK_310dfcb7c9322ee03d141cec7f1\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`timetables\` DROP FOREIGN KEY \`FK_8f9b05ccb220272e8177a218053\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`timetables\` DROP FOREIGN KEY \`FK_1ffb9fd15393cd07df02062285b\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`timetable_column_rows\` DROP FOREIGN KEY \`FK_7d7cf37ed738b70a9b359a6d9d0\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`timetable_columns\` DROP FOREIGN KEY \`FK_a81f6ad1f040a599425349f121b\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`facility_bookings\` DROP FOREIGN KEY \`FK_7bd14fb58520a9506d5639be5dd\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`facility_bookings\` DROP FOREIGN KEY \`FK_8e03e9ef8e35888f35b685925bc\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_bfa0c0ea9917eafebd29ef89a8\` ON \`timetable_year_groups\``,
    );
    await queryRunner.query(`DROP TABLE \`timetable_year_groups\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_d8a77be0bb310a5607f83c4a96\` ON \`timetable_day_row_classes\``,
    );
    await queryRunner.query(`DROP TABLE \`timetable_day_row_classes\``);
    await queryRunner.query(`DROP TABLE \`timetable_day_dates\``);
    await queryRunner.query(`DROP TABLE \`timetable_days\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_b0c9e48988efbc6bd31b90f34d\` ON \`timetables\``,
    );
    await queryRunner.query(`DROP TABLE \`timetables\``);
    await queryRunner.query(`DROP TABLE \`timetable_column_rows\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_0b847da0148c5af4b8a5a6dab6\` ON \`timetable_columns\``,
    );
    await queryRunner.query(`DROP TABLE \`timetable_columns\``);
    await queryRunner.query(`DROP TABLE \`facility_bookings\``);
  }
}
