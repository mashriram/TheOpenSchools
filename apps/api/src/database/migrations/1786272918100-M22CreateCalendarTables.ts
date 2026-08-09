import { MigrationInterface, QueryRunner } from 'typeorm';

export class M22CreateCalendarTables1786272918100 implements MigrationInterface {
  name = 'M22CreateCalendarTables1786272918100';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`calendars\` (\`id\` varchar(36) NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` timestamp(6) NULL, \`schoolYearId\` varchar(36) NOT NULL, \`name\` varchar(60) NOT NULL, \`description\` varchar(255) NULL, \`summary\` text NULL, \`color\` varchar(7) NULL, \`public\` tinyint NOT NULL DEFAULT 0, \`viewableStaff\` tinyint NOT NULL DEFAULT 0, \`viewableStudents\` tinyint NOT NULL DEFAULT 0, \`viewableParents\` tinyint NOT NULL DEFAULT 0, \`viewableOther\` tinyint NOT NULL DEFAULT 0, \`viewableParticipants\` tinyint NOT NULL DEFAULT 0, \`editableStaff\` tinyint NOT NULL DEFAULT 0, \`sequenceNumber\` int NOT NULL DEFAULT '0', UNIQUE INDEX \`IDX_d08aaeb09e91ba56189b8b456e\` (\`schoolYearId\`, \`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`calendar_editors\` (\`id\` varchar(36) NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`calendarId\` varchar(36) NOT NULL, \`personId\` varchar(36) NOT NULL, \`editAllEvents\` tinyint NOT NULL DEFAULT 0, UNIQUE INDEX \`IDX_dc525ab1d769af9b2fca35a60c\` (\`calendarId\`, \`personId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`calendar_event_types\` (\`id\` varchar(36) NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` timestamp(6) NULL, \`schoolId\` varchar(36) NOT NULL, \`name\` varchar(60) NOT NULL, \`color\` varchar(7) NULL, \`sequenceNumber\` int NOT NULL DEFAULT '0', UNIQUE INDEX \`IDX_cd8e9a1db383b72c64ec8d3b0c\` (\`schoolId\`, \`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`calendar_events\` (\`id\` varchar(36) NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`calendarId\` varchar(36) NOT NULL, \`eventTypeId\` varchar(36) NULL, \`name\` varchar(120) NOT NULL, \`description\` text NULL, \`status\` varchar(10) NOT NULL DEFAULT 'Confirmed', \`allDay\` tinyint NOT NULL DEFAULT 0, \`dateStart\` date NOT NULL, \`dateEnd\` date NOT NULL, \`timeStart\` time NULL, \`timeEnd\` time NULL, \`locationType\` varchar(10) NOT NULL DEFAULT 'External', \`locationDetail\` varchar(255) NULL, \`locationUrl\` varchar(255) NULL, \`spaceId\` varchar(36) NULL, \`createdByPersonId\` varchar(36) NULL, \`organiserPersonId\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`calendar_event_people\` (\`id\` varchar(36) NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`eventId\` varchar(36) NOT NULL, \`personId\` varchar(36) NOT NULL, \`role\` varchar(12) NOT NULL DEFAULT 'Attendee', UNIQUE INDEX \`IDX_03c5976813ee075d85a5712b79\` (\`eventId\`, \`personId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`calendars\` ADD CONSTRAINT \`FK_2fa35710639254ebc8ba4cdb2e6\` FOREIGN KEY (\`schoolYearId\`) REFERENCES \`school_years\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`calendar_editors\` ADD CONSTRAINT \`FK_d2221cf74f5b2e42fb7fbeb82d0\` FOREIGN KEY (\`calendarId\`) REFERENCES \`calendars\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`calendar_editors\` ADD CONSTRAINT \`FK_ce7366945db28a499c2fd98f902\` FOREIGN KEY (\`personId\`) REFERENCES \`people\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`calendar_event_types\` ADD CONSTRAINT \`FK_f1b1b6244f0a1178a18ffc179d8\` FOREIGN KEY (\`schoolId\`) REFERENCES \`schools\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`calendar_events\` ADD CONSTRAINT \`FK_b2a0e430ef6d7101c320fe444c1\` FOREIGN KEY (\`calendarId\`) REFERENCES \`calendars\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`calendar_events\` ADD CONSTRAINT \`FK_00a224685cccb4cb9aceeb72b03\` FOREIGN KEY (\`eventTypeId\`) REFERENCES \`calendar_event_types\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`calendar_events\` ADD CONSTRAINT \`FK_3aa6d2bc8c12dbc5aa00eddb234\` FOREIGN KEY (\`spaceId\`) REFERENCES \`spaces\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`calendar_events\` ADD CONSTRAINT \`FK_17fa5f792e0825570733d4fa5b6\` FOREIGN KEY (\`createdByPersonId\`) REFERENCES \`people\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`calendar_events\` ADD CONSTRAINT \`FK_8265e06c8ee3a4ce750977c587c\` FOREIGN KEY (\`organiserPersonId\`) REFERENCES \`people\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`calendar_event_people\` ADD CONSTRAINT \`FK_a0cbb9301377c299a6ead27ac9c\` FOREIGN KEY (\`eventId\`) REFERENCES \`calendar_events\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`calendar_event_people\` ADD CONSTRAINT \`FK_8746ee1bdb870744ddf28e8bbea\` FOREIGN KEY (\`personId\`) REFERENCES \`people\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`calendar_event_people\` DROP FOREIGN KEY \`FK_8746ee1bdb870744ddf28e8bbea\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`calendar_event_people\` DROP FOREIGN KEY \`FK_a0cbb9301377c299a6ead27ac9c\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`calendar_events\` DROP FOREIGN KEY \`FK_8265e06c8ee3a4ce750977c587c\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`calendar_events\` DROP FOREIGN KEY \`FK_17fa5f792e0825570733d4fa5b6\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`calendar_events\` DROP FOREIGN KEY \`FK_3aa6d2bc8c12dbc5aa00eddb234\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`calendar_events\` DROP FOREIGN KEY \`FK_00a224685cccb4cb9aceeb72b03\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`calendar_events\` DROP FOREIGN KEY \`FK_b2a0e430ef6d7101c320fe444c1\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`calendar_event_types\` DROP FOREIGN KEY \`FK_f1b1b6244f0a1178a18ffc179d8\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`calendar_editors\` DROP FOREIGN KEY \`FK_ce7366945db28a499c2fd98f902\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`calendar_editors\` DROP FOREIGN KEY \`FK_d2221cf74f5b2e42fb7fbeb82d0\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`calendars\` DROP FOREIGN KEY \`FK_2fa35710639254ebc8ba4cdb2e6\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_03c5976813ee075d85a5712b79\` ON \`calendar_event_people\``,
    );
    await queryRunner.query(`DROP TABLE \`calendar_event_people\``);
    await queryRunner.query(`DROP TABLE \`calendar_events\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_cd8e9a1db383b72c64ec8d3b0c\` ON \`calendar_event_types\``,
    );
    await queryRunner.query(`DROP TABLE \`calendar_event_types\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_dc525ab1d769af9b2fca35a60c\` ON \`calendar_editors\``,
    );
    await queryRunner.query(`DROP TABLE \`calendar_editors\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_d08aaeb09e91ba56189b8b456e\` ON \`calendars\``,
    );
    await queryRunner.query(`DROP TABLE \`calendars\``);
  }
}
