import { MigrationInterface, QueryRunner } from 'typeorm';

export class M3CreateSchoolAdminTables1786156255862 implements MigrationInterface {
  name = 'M3CreateSchoolAdminTables1786156255862';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`houses\` (\`id\` varchar(36) NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` timestamp(6) NULL, \`schoolId\` varchar(36) NOT NULL, \`name\` varchar(60) NOT NULL, \`shortName\` varchar(8) NOT NULL, \`logoUrl\` varchar(255) NULL, UNIQUE INDEX \`IDX_2c7d86083f170f9da351c50d0e\` (\`schoolId\`, \`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`departments\` (\`id\` varchar(36) NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` timestamp(6) NULL, \`schoolId\` varchar(36) NOT NULL, \`type\` varchar(20) NOT NULL, \`name\` varchar(60) NOT NULL, \`shortName\` varchar(8) NOT NULL, \`subjectListing\` text NULL, \`blurb\` text NULL, \`logoUrl\` varchar(255) NULL, \`sequenceNumber\` int NOT NULL DEFAULT '0', \`customFields\` json NULL, UNIQUE INDEX \`IDX_223e7074701bc3fffd2b47cdc5\` (\`schoolId\`, \`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`spaces\` (\`id\` varchar(36) NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` timestamp(6) NULL, \`schoolId\` varchar(36) NOT NULL, \`name\` varchar(60) NOT NULL, \`type\` varchar(30) NULL, \`active\` tinyint NOT NULL DEFAULT 1, \`bookable\` tinyint NOT NULL DEFAULT 1, \`capacity\` int NULL, \`hasComputer\` tinyint NOT NULL DEFAULT 0, \`hasProjector\` tinyint NOT NULL DEFAULT 0, \`hasTv\` tinyint NOT NULL DEFAULT 0, \`hasDvd\` tinyint NOT NULL DEFAULT 0, \`hasHifi\` tinyint NOT NULL DEFAULT 0, \`hasSpeakers\` tinyint NOT NULL DEFAULT 0, \`hasIwb\` tinyint NOT NULL DEFAULT 0, \`computerStudentCount\` int NULL, \`phoneInternal\` varchar(20) NULL, \`phoneExternal\` varchar(20) NULL, \`comment\` text NULL, UNIQUE INDEX \`IDX_87bc97bbda0971ced06fbb181b\` (\`schoolId\`, \`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`form_groups\` (\`id\` varchar(36) NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` timestamp(6) NULL, \`schoolYearId\` varchar(36) NOT NULL, \`name\` varchar(60) NOT NULL, \`shortName\` varchar(8) NOT NULL, \`spaceId\` varchar(36) NULL, \`nextFormGroupId\` varchar(36) NULL, \`attendance\` tinyint NOT NULL DEFAULT 1, \`website\` varchar(255) NULL, UNIQUE INDEX \`IDX_5a83438f741f062ad4b615b16b\` (\`schoolYearId\`, \`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`form_group_staff\` (\`id\` varchar(36) NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`formGroupId\` varchar(36) NOT NULL, \`personId\` varchar(36) NOT NULL, \`role\` varchar(20) NOT NULL, \`priority\` int NOT NULL DEFAULT '0', UNIQUE INDEX \`IDX_27f751d62554ca8c8654a75d88\` (\`formGroupId\`, \`personId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`settings\` (\`id\` varchar(36) NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`schoolId\` varchar(36) NOT NULL, \`scope\` varchar(40) NOT NULL, \`name\` varchar(60) NOT NULL, \`nameDisplay\` varchar(120) NOT NULL, \`description\` text NULL, \`value\` text NULL, UNIQUE INDEX \`IDX_bef7385415f2981873ce2d0a80\` (\`schoolId\`, \`scope\`, \`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`year_groups\` (\`id\` varchar(36) NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` timestamp(6) NULL, \`schoolId\` varchar(36) NOT NULL, \`name\` varchar(60) NOT NULL, \`shortName\` varchar(8) NOT NULL, \`sequenceNumber\` int NOT NULL, \`headOfYearPersonId\` varchar(36) NULL, UNIQUE INDEX \`IDX_a6f3c8f4d6b1a426f1ca724c7f\` (\`schoolId\`, \`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`houses\` ADD CONSTRAINT \`FK_a34639da91979ed58b4f2d35c84\` FOREIGN KEY (\`schoolId\`) REFERENCES \`schools\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`people\` ADD CONSTRAINT \`FK_c84d17de8a30f9033a773d8a175\` FOREIGN KEY (\`houseId\`) REFERENCES \`houses\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`departments\` ADD CONSTRAINT \`FK_a84f54ed79e0a301622069efd92\` FOREIGN KEY (\`schoolId\`) REFERENCES \`schools\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`spaces\` ADD CONSTRAINT \`FK_2038e6ea1243c8718cf7b2d02ec\` FOREIGN KEY (\`schoolId\`) REFERENCES \`schools\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`form_groups\` ADD CONSTRAINT \`FK_f12360f0bea0f7092c484348982\` FOREIGN KEY (\`schoolYearId\`) REFERENCES \`school_years\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`form_groups\` ADD CONSTRAINT \`FK_46675b2666387fc62f841a188ae\` FOREIGN KEY (\`spaceId\`) REFERENCES \`spaces\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`form_groups\` ADD CONSTRAINT \`FK_4404a770f81f2d4f9bdfc16247a\` FOREIGN KEY (\`nextFormGroupId\`) REFERENCES \`form_groups\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`form_group_staff\` ADD CONSTRAINT \`FK_c7f56d6765efec54bd3a525fbd7\` FOREIGN KEY (\`formGroupId\`) REFERENCES \`form_groups\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`form_group_staff\` ADD CONSTRAINT \`FK_67a8c67a087283847591edd32a4\` FOREIGN KEY (\`personId\`) REFERENCES \`people\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`settings\` ADD CONSTRAINT \`FK_87d4ca13a9d2376d589389e1aa0\` FOREIGN KEY (\`schoolId\`) REFERENCES \`schools\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`year_groups\` ADD CONSTRAINT \`FK_77f6b476658d952c3747b1081e5\` FOREIGN KEY (\`schoolId\`) REFERENCES \`schools\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`year_groups\` ADD CONSTRAINT \`FK_ead87755b45df21c60aa1110e91\` FOREIGN KEY (\`headOfYearPersonId\`) REFERENCES \`people\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`year_groups\` DROP FOREIGN KEY \`FK_ead87755b45df21c60aa1110e91\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`year_groups\` DROP FOREIGN KEY \`FK_77f6b476658d952c3747b1081e5\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`settings\` DROP FOREIGN KEY \`FK_87d4ca13a9d2376d589389e1aa0\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`form_group_staff\` DROP FOREIGN KEY \`FK_67a8c67a087283847591edd32a4\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`form_group_staff\` DROP FOREIGN KEY \`FK_c7f56d6765efec54bd3a525fbd7\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`form_groups\` DROP FOREIGN KEY \`FK_4404a770f81f2d4f9bdfc16247a\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`form_groups\` DROP FOREIGN KEY \`FK_46675b2666387fc62f841a188ae\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`form_groups\` DROP FOREIGN KEY \`FK_f12360f0bea0f7092c484348982\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`spaces\` DROP FOREIGN KEY \`FK_2038e6ea1243c8718cf7b2d02ec\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`departments\` DROP FOREIGN KEY \`FK_a84f54ed79e0a301622069efd92\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`people\` DROP FOREIGN KEY \`FK_c84d17de8a30f9033a773d8a175\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`houses\` DROP FOREIGN KEY \`FK_a34639da91979ed58b4f2d35c84\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_a6f3c8f4d6b1a426f1ca724c7f\` ON \`year_groups\``,
    );
    await queryRunner.query(`DROP TABLE \`year_groups\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_bef7385415f2981873ce2d0a80\` ON \`settings\``,
    );
    await queryRunner.query(`DROP TABLE \`settings\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_27f751d62554ca8c8654a75d88\` ON \`form_group_staff\``,
    );
    await queryRunner.query(`DROP TABLE \`form_group_staff\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_5a83438f741f062ad4b615b16b\` ON \`form_groups\``,
    );
    await queryRunner.query(`DROP TABLE \`form_groups\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_87bc97bbda0971ced06fbb181b\` ON \`spaces\``,
    );
    await queryRunner.query(`DROP TABLE \`spaces\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_223e7074701bc3fffd2b47cdc5\` ON \`departments\``,
    );
    await queryRunner.query(`DROP TABLE \`departments\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_2c7d86083f170f9da351c50d0e\` ON \`houses\``,
    );
    await queryRunner.query(`DROP TABLE \`houses\``);
  }
}
