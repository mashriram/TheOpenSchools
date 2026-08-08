import { MigrationInterface, QueryRunner } from 'typeorm';

export class M18CreateIndividualNeedsTables1786209773598 implements MigrationInterface {
  name = 'M18CreateIndividualNeedsTables1786209773598';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`individual_need_investigations\` (\`id\` varchar(36) NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`schoolYearId\` varchar(36) NOT NULL, \`creatorPersonId\` varchar(36) NULL, \`studentPersonId\` varchar(36) NOT NULL, \`status\` varchar(24) NOT NULL DEFAULT 'Referral', \`date\` date NOT NULL, \`reason\` text NOT NULL, \`strategiesTried\` text NULL, \`parentsInformed\` tinyint NOT NULL DEFAULT 0, \`parentsResponse\` text NULL, \`resolutionDetails\` text NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`individual_need_investigation_contributions\` (\`id\` varchar(36) NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`investigationId\` varchar(36) NOT NULL, \`type\` varchar(16) NOT NULL DEFAULT 'Teacher', \`personId\` varchar(36) NOT NULL, \`courseClassPersonId\` varchar(36) NULL, \`status\` varchar(10) NOT NULL DEFAULT 'Pending', \`cognition\` text NULL, \`memory\` text NULL, \`selfManagement\` text NULL, \`attention\` text NULL, \`socialInteraction\` text NULL, \`communication\` text NULL, \`comment\` text NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`individual_need_person_descriptors\` (\`id\` varchar(36) NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`personId\` varchar(36) NOT NULL, \`descriptor\` varchar(20) NOT NULL, \`level\` varchar(10) NULL, UNIQUE INDEX \`IDX_62eae23906137ad8fe29580bfa\` (\`personId\`, \`descriptor\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`individual_needs\` (\`id\` varchar(36) NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`personId\` varchar(36) NOT NULL, \`strategies\` text NULL, \`targets\` text NULL, \`notes\` text NULL, \`customFields\` json NULL, UNIQUE INDEX \`IDX_90940bae85689c4f23167c5dc9\` (\`personId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`individual_need_investigations\` ADD CONSTRAINT \`FK_ee2353f7f473f01016aba3f5efa\` FOREIGN KEY (\`schoolYearId\`) REFERENCES \`school_years\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`individual_need_investigations\` ADD CONSTRAINT \`FK_8a9972957b2180e50eda2f1b7fd\` FOREIGN KEY (\`creatorPersonId\`) REFERENCES \`people\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`individual_need_investigations\` ADD CONSTRAINT \`FK_ee08d692ae72c06e78cf431930d\` FOREIGN KEY (\`studentPersonId\`) REFERENCES \`people\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`individual_need_investigation_contributions\` ADD CONSTRAINT \`FK_1f660609e8178a0dc97181358e6\` FOREIGN KEY (\`investigationId\`) REFERENCES \`individual_need_investigations\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`individual_need_investigation_contributions\` ADD CONSTRAINT \`FK_552b78db619a1e34af92eaa9bd6\` FOREIGN KEY (\`personId\`) REFERENCES \`people\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`individual_need_investigation_contributions\` ADD CONSTRAINT \`FK_4147cdaa77be909498935632338\` FOREIGN KEY (\`courseClassPersonId\`) REFERENCES \`course_class_people\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`individual_need_person_descriptors\` ADD CONSTRAINT \`FK_fa25f2a467e8122283563c01845\` FOREIGN KEY (\`personId\`) REFERENCES \`people\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`individual_needs\` ADD CONSTRAINT \`FK_90940bae85689c4f23167c5dc99\` FOREIGN KEY (\`personId\`) REFERENCES \`people\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`individual_needs\` DROP FOREIGN KEY \`FK_90940bae85689c4f23167c5dc99\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`individual_need_person_descriptors\` DROP FOREIGN KEY \`FK_fa25f2a467e8122283563c01845\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`individual_need_investigation_contributions\` DROP FOREIGN KEY \`FK_4147cdaa77be909498935632338\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`individual_need_investigation_contributions\` DROP FOREIGN KEY \`FK_552b78db619a1e34af92eaa9bd6\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`individual_need_investigation_contributions\` DROP FOREIGN KEY \`FK_1f660609e8178a0dc97181358e6\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`individual_need_investigations\` DROP FOREIGN KEY \`FK_ee08d692ae72c06e78cf431930d\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`individual_need_investigations\` DROP FOREIGN KEY \`FK_8a9972957b2180e50eda2f1b7fd\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`individual_need_investigations\` DROP FOREIGN KEY \`FK_ee2353f7f473f01016aba3f5efa\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_90940bae85689c4f23167c5dc9\` ON \`individual_needs\``,
    );
    await queryRunner.query(`DROP TABLE \`individual_needs\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_62eae23906137ad8fe29580bfa\` ON \`individual_need_person_descriptors\``,
    );
    await queryRunner.query(
      `DROP TABLE \`individual_need_person_descriptors\``,
    );
    await queryRunner.query(
      `DROP TABLE \`individual_need_investigation_contributions\``,
    );
    await queryRunner.query(`DROP TABLE \`individual_need_investigations\``);
  }
}
