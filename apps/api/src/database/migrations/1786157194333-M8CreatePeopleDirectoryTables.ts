import { MigrationInterface, QueryRunner } from 'typeorm';

export class M8CreatePeopleDirectoryTables1786157194333 implements MigrationInterface {
  name = 'M8CreatePeopleDirectoryTables1786157194333';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`families\` (\`id\` varchar(36) NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` timestamp(6) NULL, \`schoolId\` varchar(36) NOT NULL, \`name\` varchar(90) NOT NULL, \`nameAddress\` varchar(90) NULL, \`homeAddress\` text NULL, \`homeAddressDistrict\` varchar(255) NULL, \`homeAddressCountry\` varchar(255) NULL, \`status\` varchar(20) NOT NULL DEFAULT 'Married', \`languageHomePrimary\` varchar(30) NULL, \`languageHomeSecondary\` varchar(30) NULL, \`familySync\` tinyint NOT NULL DEFAULT 0, \`customFields\` json NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`family_adults\` (\`id\` varchar(36) NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`familyId\` varchar(36) NOT NULL, \`personId\` varchar(36) NOT NULL, \`comment\` text NULL, \`childDataAccess\` tinyint NOT NULL DEFAULT 1, \`contactPriority\` int NOT NULL DEFAULT '0', \`contactCall\` tinyint NOT NULL DEFAULT 1, \`contactSms\` tinyint NOT NULL DEFAULT 1, \`contactEmail\` tinyint NOT NULL DEFAULT 1, \`contactMail\` tinyint NOT NULL DEFAULT 1, UNIQUE INDEX \`IDX_86e52b2268fe411590f71d7112\` (\`familyId\`, \`personId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`family_children\` (\`id\` varchar(36) NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`familyId\` varchar(36) NOT NULL, \`personId\` varchar(36) NOT NULL, \`comment\` text NULL, UNIQUE INDEX \`IDX_c1e7f8cb430a9937506b2949d9\` (\`familyId\`, \`personId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`staff\` (\`id\` varchar(36) NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` timestamp(6) NULL, \`personId\` varchar(36) NOT NULL, \`type\` varchar(40) NULL, \`initials\` varchar(10) NULL, \`jobTitle\` varchar(90) NULL, \`firstAidQualified\` tinyint NULL, \`firstAidQualification\` varchar(90) NULL, \`firstAidExpiry\` date NULL, \`countryOfOrigin\` varchar(60) NULL, \`qualifications\` text NULL, \`biography\` text NULL, \`biographicalGrouping\` varchar(60) NULL, \`biographicalGroupingPriority\` int NOT NULL DEFAULT '0', \`coverageExclude\` tinyint NOT NULL DEFAULT 0, \`coveragePriority\` int NOT NULL DEFAULT '0', \`customFields\` json NULL, UNIQUE INDEX \`REL_5e875b009d28d4c150969da108\` (\`personId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`student_enrolments\` (\`id\` varchar(36) NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` timestamp(6) NULL, \`personId\` varchar(36) NOT NULL, \`schoolYearId\` varchar(36) NOT NULL, \`yearGroupId\` varchar(36) NOT NULL, \`formGroupId\` varchar(36) NOT NULL, \`rollOrder\` int NULL, \`customFields\` json NULL, UNIQUE INDEX \`IDX_e8cac46168117f803c9160517d\` (\`personId\`, \`schoolYearId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`families\` ADD CONSTRAINT \`FK_68ae56bee23e663b633c4294121\` FOREIGN KEY (\`schoolId\`) REFERENCES \`schools\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`family_adults\` ADD CONSTRAINT \`FK_0825fb2cf9f842e628cf940351c\` FOREIGN KEY (\`familyId\`) REFERENCES \`families\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`family_adults\` ADD CONSTRAINT \`FK_b69c9058c76b99531583bb30057\` FOREIGN KEY (\`personId\`) REFERENCES \`people\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`family_children\` ADD CONSTRAINT \`FK_e39516d0c91136617deb177d806\` FOREIGN KEY (\`familyId\`) REFERENCES \`families\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`family_children\` ADD CONSTRAINT \`FK_bd43497fccd1636c678201e1b42\` FOREIGN KEY (\`personId\`) REFERENCES \`people\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`staff\` ADD CONSTRAINT \`FK_5e875b009d28d4c150969da1081\` FOREIGN KEY (\`personId\`) REFERENCES \`people\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`student_enrolments\` ADD CONSTRAINT \`FK_f05dcf84380d8ba1f9ff3a53f06\` FOREIGN KEY (\`personId\`) REFERENCES \`people\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`student_enrolments\` ADD CONSTRAINT \`FK_1ada231062600e702bd8cf626f8\` FOREIGN KEY (\`schoolYearId\`) REFERENCES \`school_years\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`student_enrolments\` ADD CONSTRAINT \`FK_673b24dc9b0657af7008d09db52\` FOREIGN KEY (\`yearGroupId\`) REFERENCES \`year_groups\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`student_enrolments\` ADD CONSTRAINT \`FK_8de90339eb586eb8644e4c6cd03\` FOREIGN KEY (\`formGroupId\`) REFERENCES \`form_groups\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`student_enrolments\` DROP FOREIGN KEY \`FK_8de90339eb586eb8644e4c6cd03\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`student_enrolments\` DROP FOREIGN KEY \`FK_673b24dc9b0657af7008d09db52\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`student_enrolments\` DROP FOREIGN KEY \`FK_1ada231062600e702bd8cf626f8\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`student_enrolments\` DROP FOREIGN KEY \`FK_f05dcf84380d8ba1f9ff3a53f06\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`staff\` DROP FOREIGN KEY \`FK_5e875b009d28d4c150969da1081\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`family_children\` DROP FOREIGN KEY \`FK_bd43497fccd1636c678201e1b42\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`family_children\` DROP FOREIGN KEY \`FK_e39516d0c91136617deb177d806\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`family_adults\` DROP FOREIGN KEY \`FK_b69c9058c76b99531583bb30057\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`family_adults\` DROP FOREIGN KEY \`FK_0825fb2cf9f842e628cf940351c\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`families\` DROP FOREIGN KEY \`FK_68ae56bee23e663b633c4294121\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_e8cac46168117f803c9160517d\` ON \`student_enrolments\``,
    );
    await queryRunner.query(`DROP TABLE \`student_enrolments\``);
    await queryRunner.query(
      `DROP INDEX \`REL_5e875b009d28d4c150969da108\` ON \`staff\``,
    );
    await queryRunner.query(`DROP TABLE \`staff\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_c1e7f8cb430a9937506b2949d9\` ON \`family_children\``,
    );
    await queryRunner.query(`DROP TABLE \`family_children\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_86e52b2268fe411590f71d7112\` ON \`family_adults\``,
    );
    await queryRunner.query(`DROP TABLE \`family_adults\``);
    await queryRunner.query(`DROP TABLE \`families\``);
  }
}
