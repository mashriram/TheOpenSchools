import { MigrationInterface, QueryRunner } from 'typeorm';

export class M23CreateMessengerTables1786274240133 implements MigrationInterface {
  name = 'M23CreateMessengerTables1786274240133';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`messenger_canned_responses\` (\`id\` varchar(36) NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` timestamp(6) NULL, \`schoolId\` varchar(36) NOT NULL, \`name\` varchar(60) NOT NULL, \`body\` text NOT NULL, UNIQUE INDEX \`IDX_a116fb16cd1709e32e9e6e59f5\` (\`schoolId\`, \`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`messenger_mailing_lists\` (\`id\` varchar(36) NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` timestamp(6) NULL, \`schoolId\` varchar(36) NOT NULL, \`name\` varchar(60) NOT NULL, UNIQUE INDEX \`IDX_83961944a64b5846fce907be13\` (\`schoolId\`, \`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`messenger_mailing_list_recipients\` (\`id\` varchar(36) NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`mailingListId\` varchar(36) NOT NULL, \`personId\` varchar(36) NOT NULL, UNIQUE INDEX \`IDX_05d177859382b410ce0bdc4f43\` (\`mailingListId\`, \`personId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`messenger_messages\` (\`id\` varchar(36) NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` timestamp(6) NULL, \`schoolId\` varchar(36) NOT NULL, \`senderPersonId\` varchar(36) NULL, \`subject\` varchar(255) NOT NULL, \`body\` text NOT NULL, \`method\` varchar(12) NOT NULL DEFAULT 'MessageWall', \`confidential\` tinyint NOT NULL DEFAULT 0, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`messenger_receipts\` (\`id\` varchar(36) NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`messengerId\` varchar(36) NOT NULL, \`personId\` varchar(36) NOT NULL, \`recipientName\` text NULL, \`confirmed\` tinyint NOT NULL DEFAULT 0, \`confirmedTimestamp\` timestamp NULL, UNIQUE INDEX \`IDX_e4f510c354af00c17dd1b48c3d\` (\`messengerId\`, \`personId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`messenger_targets\` (\`id\` varchar(36) NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`messengerId\` varchar(36) NOT NULL, \`targetType\` varchar(12) NOT NULL, \`roleId\` varchar(36) NULL, \`formGroupId\` varchar(36) NULL, \`yearGroupId\` varchar(36) NULL, \`houseId\` varchar(36) NULL, \`personId\` varchar(36) NULL, \`mailingListId\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`messenger_canned_responses\` ADD CONSTRAINT \`FK_45cf20cbda28aa7ebe0e04abdfd\` FOREIGN KEY (\`schoolId\`) REFERENCES \`schools\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`messenger_mailing_lists\` ADD CONSTRAINT \`FK_4bcd12b76e768c25dae8d5b5136\` FOREIGN KEY (\`schoolId\`) REFERENCES \`schools\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`messenger_mailing_list_recipients\` ADD CONSTRAINT \`FK_aacbeaed35d4ea3e42d02186b4a\` FOREIGN KEY (\`mailingListId\`) REFERENCES \`messenger_mailing_lists\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`messenger_mailing_list_recipients\` ADD CONSTRAINT \`FK_50db29272a2578aecb407c5115f\` FOREIGN KEY (\`personId\`) REFERENCES \`people\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`messenger_messages\` ADD CONSTRAINT \`FK_6189439bc92fb1df0ef99cc8ee8\` FOREIGN KEY (\`schoolId\`) REFERENCES \`schools\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`messenger_messages\` ADD CONSTRAINT \`FK_51a1463b636a7ddd07eae875374\` FOREIGN KEY (\`senderPersonId\`) REFERENCES \`people\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`messenger_receipts\` ADD CONSTRAINT \`FK_0c300c64fb45d2935e02bfd365c\` FOREIGN KEY (\`messengerId\`) REFERENCES \`messenger_messages\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`messenger_receipts\` ADD CONSTRAINT \`FK_6b1289b3947af525b69e4043d50\` FOREIGN KEY (\`personId\`) REFERENCES \`people\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`messenger_targets\` ADD CONSTRAINT \`FK_47f6ef398b6631d4c4cf350e352\` FOREIGN KEY (\`messengerId\`) REFERENCES \`messenger_messages\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`messenger_targets\` ADD CONSTRAINT \`FK_873df584a7ee0eb58273ebb784a\` FOREIGN KEY (\`roleId\`) REFERENCES \`rbac_roles\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`messenger_targets\` ADD CONSTRAINT \`FK_e7e75341be07e34877d46352fde\` FOREIGN KEY (\`formGroupId\`) REFERENCES \`form_groups\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`messenger_targets\` ADD CONSTRAINT \`FK_19c7a1c9e3a9eb8d9c460c0a35a\` FOREIGN KEY (\`yearGroupId\`) REFERENCES \`year_groups\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`messenger_targets\` ADD CONSTRAINT \`FK_5a8afc8977a16cb81f07a639d59\` FOREIGN KEY (\`houseId\`) REFERENCES \`houses\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`messenger_targets\` ADD CONSTRAINT \`FK_3073c438f087d4a7a52fce1d5aa\` FOREIGN KEY (\`personId\`) REFERENCES \`people\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`messenger_targets\` ADD CONSTRAINT \`FK_0c22c9bcd5f6dfedf42d902e250\` FOREIGN KEY (\`mailingListId\`) REFERENCES \`messenger_mailing_lists\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`messenger_targets\` DROP FOREIGN KEY \`FK_0c22c9bcd5f6dfedf42d902e250\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`messenger_targets\` DROP FOREIGN KEY \`FK_3073c438f087d4a7a52fce1d5aa\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`messenger_targets\` DROP FOREIGN KEY \`FK_5a8afc8977a16cb81f07a639d59\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`messenger_targets\` DROP FOREIGN KEY \`FK_19c7a1c9e3a9eb8d9c460c0a35a\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`messenger_targets\` DROP FOREIGN KEY \`FK_e7e75341be07e34877d46352fde\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`messenger_targets\` DROP FOREIGN KEY \`FK_873df584a7ee0eb58273ebb784a\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`messenger_targets\` DROP FOREIGN KEY \`FK_47f6ef398b6631d4c4cf350e352\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`messenger_receipts\` DROP FOREIGN KEY \`FK_6b1289b3947af525b69e4043d50\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`messenger_receipts\` DROP FOREIGN KEY \`FK_0c300c64fb45d2935e02bfd365c\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`messenger_messages\` DROP FOREIGN KEY \`FK_51a1463b636a7ddd07eae875374\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`messenger_messages\` DROP FOREIGN KEY \`FK_6189439bc92fb1df0ef99cc8ee8\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`messenger_mailing_list_recipients\` DROP FOREIGN KEY \`FK_50db29272a2578aecb407c5115f\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`messenger_mailing_list_recipients\` DROP FOREIGN KEY \`FK_aacbeaed35d4ea3e42d02186b4a\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`messenger_mailing_lists\` DROP FOREIGN KEY \`FK_4bcd12b76e768c25dae8d5b5136\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`messenger_canned_responses\` DROP FOREIGN KEY \`FK_45cf20cbda28aa7ebe0e04abdfd\``,
    );
    await queryRunner.query(`DROP TABLE \`messenger_targets\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_e4f510c354af00c17dd1b48c3d\` ON \`messenger_receipts\``,
    );
    await queryRunner.query(`DROP TABLE \`messenger_receipts\``);
    await queryRunner.query(`DROP TABLE \`messenger_messages\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_05d177859382b410ce0bdc4f43\` ON \`messenger_mailing_list_recipients\``,
    );
    await queryRunner.query(`DROP TABLE \`messenger_mailing_list_recipients\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_83961944a64b5846fce907be13\` ON \`messenger_mailing_lists\``,
    );
    await queryRunner.query(`DROP TABLE \`messenger_mailing_lists\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_a116fb16cd1709e32e9e6e59f5\` ON \`messenger_canned_responses\``,
    );
    await queryRunner.query(`DROP TABLE \`messenger_canned_responses\``);
  }
}
