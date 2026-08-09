import { MigrationInterface, QueryRunner } from 'typeorm';

export class M20CreateBehaviourTables1786268474555 implements MigrationInterface {
  name = 'M20CreateBehaviourTables1786268474555';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`behaviour_letter_snapshots\` (\`id\` varchar(36) NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`schoolYearId\` varchar(36) NOT NULL, \`personId\` varchar(36) NOT NULL, \`letterLevel\` varchar(1) NOT NULL, \`status\` varchar(10) NOT NULL, \`type\` varchar(10) NOT NULL DEFAULT 'Negative', \`recordCountAtCreation\` int NOT NULL, \`body\` text NULL, \`sentAt\` timestamp NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`behaviour_letter_recipients\` (\`id\` varchar(36) NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`snapshotId\` varchar(36) NOT NULL, \`personId\` varchar(36) NOT NULL, \`name\` text NULL, \`email\` text NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`behaviours\` (\`id\` varchar(36) NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`schoolYearId\` varchar(36) NOT NULL, \`date\` date NOT NULL, \`personId\` varchar(36) NOT NULL, \`type\` varchar(12) NOT NULL, \`descriptor\` varchar(100) NULL, \`level\` varchar(100) NULL, \`comment\` text NULL, \`followup\` text NULL, \`creatorPersonId\` varchar(36) NULL, \`multiIncidentId\` varchar(64) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`behaviour_follow_ups\` (\`id\` varchar(36) NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`behaviourId\` varchar(36) NOT NULL, \`personId\` varchar(36) NULL, \`followUp\` text NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`behaviour_letter_snapshots\` ADD CONSTRAINT \`FK_40ac12b711fac083e3300323a75\` FOREIGN KEY (\`schoolYearId\`) REFERENCES \`school_years\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`behaviour_letter_snapshots\` ADD CONSTRAINT \`FK_df3deb55530f011e8c90e37f5e8\` FOREIGN KEY (\`personId\`) REFERENCES \`people\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`behaviour_letter_recipients\` ADD CONSTRAINT \`FK_4c72b772b858e9cc6894b0c117d\` FOREIGN KEY (\`snapshotId\`) REFERENCES \`behaviour_letter_snapshots\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`behaviour_letter_recipients\` ADD CONSTRAINT \`FK_9c59e0a587321a7d248c51fc2a6\` FOREIGN KEY (\`personId\`) REFERENCES \`people\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`behaviours\` ADD CONSTRAINT \`FK_f709eae889fe44848c2c9879eb3\` FOREIGN KEY (\`schoolYearId\`) REFERENCES \`school_years\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`behaviours\` ADD CONSTRAINT \`FK_7d5acecb6da911e2e401e98308f\` FOREIGN KEY (\`personId\`) REFERENCES \`people\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`behaviours\` ADD CONSTRAINT \`FK_edc538e020a21eb30996936135e\` FOREIGN KEY (\`creatorPersonId\`) REFERENCES \`people\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`behaviour_follow_ups\` ADD CONSTRAINT \`FK_9ba2180ad3d4fb42723aff32b08\` FOREIGN KEY (\`behaviourId\`) REFERENCES \`behaviours\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`behaviour_follow_ups\` ADD CONSTRAINT \`FK_b91d969fa97dbd14bd144110ba8\` FOREIGN KEY (\`personId\`) REFERENCES \`people\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`behaviour_follow_ups\` DROP FOREIGN KEY \`FK_b91d969fa97dbd14bd144110ba8\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`behaviour_follow_ups\` DROP FOREIGN KEY \`FK_9ba2180ad3d4fb42723aff32b08\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`behaviours\` DROP FOREIGN KEY \`FK_edc538e020a21eb30996936135e\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`behaviours\` DROP FOREIGN KEY \`FK_7d5acecb6da911e2e401e98308f\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`behaviours\` DROP FOREIGN KEY \`FK_f709eae889fe44848c2c9879eb3\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`behaviour_letter_recipients\` DROP FOREIGN KEY \`FK_9c59e0a587321a7d248c51fc2a6\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`behaviour_letter_recipients\` DROP FOREIGN KEY \`FK_4c72b772b858e9cc6894b0c117d\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`behaviour_letter_snapshots\` DROP FOREIGN KEY \`FK_df3deb55530f011e8c90e37f5e8\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`behaviour_letter_snapshots\` DROP FOREIGN KEY \`FK_40ac12b711fac083e3300323a75\``,
    );
    await queryRunner.query(`DROP TABLE \`behaviour_follow_ups\``);
    await queryRunner.query(`DROP TABLE \`behaviours\``);
    await queryRunner.query(`DROP TABLE \`behaviour_letter_recipients\``);
    await queryRunner.query(`DROP TABLE \`behaviour_letter_snapshots\``);
  }
}
