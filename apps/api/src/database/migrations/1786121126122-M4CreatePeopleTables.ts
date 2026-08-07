import { MigrationInterface, QueryRunner } from 'typeorm';

export class M4CreatePeopleTables1786121126122 implements MigrationInterface {
  name = 'M4CreatePeopleTables1786121126122';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`people\` (\`id\` varchar(36) NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` timestamp(6) NULL, \`schoolId\` varchar(36) NOT NULL, \`title\` varchar(10) NULL, \`surname\` varchar(60) NOT NULL, \`firstName\` varchar(60) NOT NULL, \`preferredName\` varchar(60) NULL, \`officialName\` varchar(150) NULL, \`nameInCharacters\` varchar(60) NULL, \`gender\` varchar(16) NOT NULL DEFAULT 'Unspecified', \`dateOfBirth\` date NULL, \`email\` varchar(255) NULL, \`emailAlternate\` varchar(255) NULL, \`photoUrl\` varchar(255) NULL, \`status\` varchar(20) NOT NULL DEFAULT 'Full', \`address1\` text NULL, \`address1District\` varchar(255) NULL, \`address1Country\` varchar(255) NULL, \`address2\` text NULL, \`address2District\` varchar(255) NULL, \`address2Country\` varchar(255) NULL, \`website\` varchar(255) NULL, \`languageFirst\` varchar(30) NULL, \`languageSecond\` varchar(30) NULL, \`languageThird\` varchar(30) NULL, \`countryOfBirth\` varchar(60) NULL, \`ethnicity\` varchar(60) NULL, \`religion\` varchar(60) NULL, \`profession\` varchar(90) NULL, \`employer\` varchar(90) NULL, \`jobTitle\` varchar(90) NULL, \`houseId\` varchar(36) NULL, \`studentIdNumber\` varchar(20) NULL, \`dateStart\` date NULL, \`dateEnd\` date NULL, \`classOfSchoolYearId\` varchar(36) NULL, \`lastSchool\` varchar(150) NULL, \`nextSchool\` varchar(150) NULL, \`departureReason\` varchar(150) NULL, \`transport\` varchar(255) NULL, \`transportNotes\` text NULL, \`lockerNumber\` varchar(30) NULL, \`vehicleRegistration\` varchar(30) NULL, \`personalBackground\` varchar(255) NULL, \`dayType\` varchar(60) NULL, \`calendarFeedPersonal\` text NULL, \`viewCalendarSchool\` tinyint NOT NULL DEFAULT 1, \`viewCalendarPersonal\` tinyint NOT NULL DEFAULT 1, \`viewCalendarSpaceBooking\` tinyint NOT NULL DEFAULT 0, \`studentAgreements\` text NULL, \`receiveNotificationEmails\` tinyint NOT NULL DEFAULT 1, \`messengerLastReadAt\` timestamp NULL, \`cookieConsent\` tinyint NULL, \`privacy\` text NULL, \`preferences\` text NULL, \`customFields\` json NULL, UNIQUE INDEX \`IDX_e40786a589495dce9ac0045cf3\` (\`schoolId\`, \`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`person_credentials\` (\`id\` varchar(36) NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`personId\` varchar(36) NOT NULL, \`schoolId\` varchar(36) NOT NULL, \`username\` varchar(60) NOT NULL, \`passwordHash\` varchar(255) NOT NULL, \`passwordForceReset\` tinyint NOT NULL DEFAULT 0, \`canLogin\` tinyint NOT NULL DEFAULT 1, \`mfaSecret\` varchar(32) NULL, \`mfaEnabled\` tinyint NOT NULL DEFAULT 0, \`lastLoginAt\` timestamp NULL, \`lastLoginIp\` varchar(45) NULL, \`lastFailedLoginAt\` timestamp NULL, \`lastFailedLoginIp\` varchar(45) NULL, \`failedLoginCount\` int NOT NULL DEFAULT '0', \`emailVerifiedAt\` timestamp NULL, UNIQUE INDEX \`IDX_cd1fa3ac57bcd180b12464ef5c\` (\`schoolId\`, \`username\`), UNIQUE INDEX \`REL_5154109b9f8a9ed9671ecc7691\` (\`personId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`person_emergency_contacts\` (\`id\` varchar(36) NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`personId\` varchar(36) NOT NULL, \`name\` varchar(90) NOT NULL, \`phone1\` varchar(30) NULL, \`phone2\` varchar(30) NULL, \`relationship\` varchar(60) NULL, \`priority\` int NOT NULL DEFAULT '0', PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`person_oauth_connections\` (\`id\` varchar(36) NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`personId\` varchar(36) NOT NULL, \`provider\` varchar(16) NOT NULL, \`refreshToken\` text NOT NULL, UNIQUE INDEX \`IDX_4eb80c99a6e1bb3974916f9420\` (\`personId\`, \`provider\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`person_phones\` (\`id\` varchar(36) NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`personId\` varchar(36) NOT NULL, \`type\` varchar(16) NOT NULL, \`countryCode\` varchar(8) NULL, \`number\` varchar(30) NOT NULL, \`priority\` int NOT NULL DEFAULT '0', PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`person_roles\` (\`id\` varchar(36) NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`personId\` varchar(36) NOT NULL, \`roleId\` varchar(36) NOT NULL, \`isPrimary\` tinyint NOT NULL DEFAULT 0, UNIQUE INDEX \`IDX_854c936822ff5507cfa8053e07\` (\`personId\`, \`roleId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`people\` ADD CONSTRAINT \`FK_7de389a40412e22b1642ab01e4a\` FOREIGN KEY (\`schoolId\`) REFERENCES \`schools\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`people\` ADD CONSTRAINT \`FK_19a924ead9cb2f3f12fb7640e57\` FOREIGN KEY (\`classOfSchoolYearId\`) REFERENCES \`school_years\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`person_credentials\` ADD CONSTRAINT \`FK_5154109b9f8a9ed9671ecc76917\` FOREIGN KEY (\`personId\`) REFERENCES \`people\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`person_emergency_contacts\` ADD CONSTRAINT \`FK_b9fbcc8bc6bce4e3628e11875a9\` FOREIGN KEY (\`personId\`) REFERENCES \`people\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`person_oauth_connections\` ADD CONSTRAINT \`FK_ee49d5c1d2838cd642027404815\` FOREIGN KEY (\`personId\`) REFERENCES \`people\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`person_phones\` ADD CONSTRAINT \`FK_9276b0f1041bc8cd37453da10b6\` FOREIGN KEY (\`personId\`) REFERENCES \`people\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`person_roles\` ADD CONSTRAINT \`FK_9a12accee1507f0bba26e7788f0\` FOREIGN KEY (\`personId\`) REFERENCES \`people\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`person_roles\` ADD CONSTRAINT \`FK_32b22e80cb9f872f9c2239edcc3\` FOREIGN KEY (\`roleId\`) REFERENCES \`rbac_roles\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`person_roles\` DROP FOREIGN KEY \`FK_32b22e80cb9f872f9c2239edcc3\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`person_roles\` DROP FOREIGN KEY \`FK_9a12accee1507f0bba26e7788f0\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`person_phones\` DROP FOREIGN KEY \`FK_9276b0f1041bc8cd37453da10b6\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`person_oauth_connections\` DROP FOREIGN KEY \`FK_ee49d5c1d2838cd642027404815\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`person_emergency_contacts\` DROP FOREIGN KEY \`FK_b9fbcc8bc6bce4e3628e11875a9\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`person_credentials\` DROP FOREIGN KEY \`FK_5154109b9f8a9ed9671ecc76917\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`people\` DROP FOREIGN KEY \`FK_19a924ead9cb2f3f12fb7640e57\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`people\` DROP FOREIGN KEY \`FK_7de389a40412e22b1642ab01e4a\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_854c936822ff5507cfa8053e07\` ON \`person_roles\``,
    );
    await queryRunner.query(`DROP TABLE \`person_roles\``);
    await queryRunner.query(`DROP TABLE \`person_phones\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_4eb80c99a6e1bb3974916f9420\` ON \`person_oauth_connections\``,
    );
    await queryRunner.query(`DROP TABLE \`person_oauth_connections\``);
    await queryRunner.query(`DROP TABLE \`person_emergency_contacts\``);
    await queryRunner.query(
      `DROP INDEX \`REL_5154109b9f8a9ed9671ecc7691\` ON \`person_credentials\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_cd1fa3ac57bcd180b12464ef5c\` ON \`person_credentials\``,
    );
    await queryRunner.query(`DROP TABLE \`person_credentials\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_e40786a589495dce9ac0045cf3\` ON \`people\``,
    );
    await queryRunner.query(`DROP TABLE \`people\``);
  }
}
