import { MigrationInterface, QueryRunner } from 'typeorm';

export class M21CreateFinanceTables1786270130855 implements MigrationInterface {
  name = 'M21CreateFinanceTables1786270130855';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`finance_billing_schedules\` (\`id\` varchar(36) NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` timestamp(6) NULL, \`schoolYearId\` varchar(36) NOT NULL, \`name\` varchar(100) NOT NULL, \`description\` text NULL, \`active\` tinyint NOT NULL DEFAULT 1, \`invoiceIssueDate\` date NULL, \`invoiceDueDate\` date NULL, UNIQUE INDEX \`IDX_41e1df5dd541626c6efa87bce1\` (\`schoolYearId\`, \`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`finance_fee_categories\` (\`id\` varchar(36) NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` timestamp(6) NULL, \`schoolId\` varchar(36) NOT NULL, \`name\` varchar(100) NOT NULL, \`shortName\` varchar(6) NOT NULL, \`description\` text NULL, \`active\` tinyint NOT NULL DEFAULT 1, UNIQUE INDEX \`IDX_7494dbf8919b8340dcc911f76e\` (\`schoolId\`, \`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`finance_fees\` (\`id\` varchar(36) NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` timestamp(6) NULL, \`schoolYearId\` varchar(36) NOT NULL, \`name\` varchar(100) NOT NULL, \`shortName\` varchar(6) NOT NULL, \`description\` text NULL, \`active\` tinyint NOT NULL DEFAULT 1, \`feeCategoryId\` varchar(36) NOT NULL, \`amount\` decimal(12,2) NOT NULL, UNIQUE INDEX \`IDX_78c955df85492d147522276be9\` (\`schoolYearId\`, \`shortName\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`finance_invoicees\` (\`id\` varchar(36) NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`studentPersonId\` varchar(36) NOT NULL, \`invoiceTo\` varchar(10) NOT NULL, \`companyName\` varchar(100) NULL, \`companyContact\` varchar(100) NULL, \`companyAddress\` varchar(255) NULL, \`companyEmail\` varchar(255) NULL, \`companyPhone\` varchar(20) NULL, \`companyCCFamily\` tinyint NULL, \`companyAll\` tinyint NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`finance_invoices\` (\`id\` varchar(36) NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`schoolYearId\` varchar(36) NOT NULL, \`invoiceeId\` varchar(36) NOT NULL, \`billingScheduleId\` varchar(36) NULL, \`status\` varchar(16) NOT NULL DEFAULT 'Pending', \`invoiceIssueDate\` date NULL, \`invoiceDueDate\` date NULL, \`paidDate\` date NULL, \`paidAmount\` decimal(13,2) NOT NULL DEFAULT '0.00', \`reminderCount\` int NOT NULL DEFAULT '0', \`notes\` text NULL, \`retentionPeriodMonths\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`finance_invoice_fees\` (\`id\` varchar(36) NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`invoiceId\` varchar(36) NOT NULL, \`feeType\` varchar(10) NOT NULL DEFAULT 'AdHoc', \`feeId\` varchar(36) NULL, \`name\` varchar(100) NOT NULL, \`description\` text NULL, \`feeCategoryId\` varchar(36) NULL, \`amount\` decimal(12,2) NOT NULL, \`sequenceNumber\` int NOT NULL DEFAULT '0', PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`payments\` (\`id\` varchar(36) NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`invoiceId\` varchar(36) NOT NULL, \`recorderPersonId\` varchar(36) NULL, \`type\` varchar(60) NOT NULL DEFAULT 'Online', \`status\` varchar(10) NOT NULL DEFAULT 'Complete', \`amount\` decimal(13,2) NOT NULL, \`gateway\` varchar(30) NULL, \`onlineTransactionStatus\` varchar(10) NULL, \`paymentToken\` varchar(255) NULL, \`paymentPayerId\` varchar(50) NULL, \`paymentTransactionId\` varchar(50) NULL, \`paymentReceiptId\` varchar(50) NULL, \`occurredAt\` timestamp NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`finance_billing_schedules\` ADD CONSTRAINT \`FK_abeb5e47640b74aef7dd63235ff\` FOREIGN KEY (\`schoolYearId\`) REFERENCES \`school_years\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`finance_fee_categories\` ADD CONSTRAINT \`FK_7b55852f29fa764124404212029\` FOREIGN KEY (\`schoolId\`) REFERENCES \`schools\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`finance_fees\` ADD CONSTRAINT \`FK_7ed9624f1f66fd9735b514faab0\` FOREIGN KEY (\`schoolYearId\`) REFERENCES \`school_years\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`finance_fees\` ADD CONSTRAINT \`FK_a94a3d1f731c18571429026be8f\` FOREIGN KEY (\`feeCategoryId\`) REFERENCES \`finance_fee_categories\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`finance_invoicees\` ADD CONSTRAINT \`FK_4e2f42944addd61e49207840b1b\` FOREIGN KEY (\`studentPersonId\`) REFERENCES \`people\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`finance_invoices\` ADD CONSTRAINT \`FK_820a4a471811094973e5125ac26\` FOREIGN KEY (\`schoolYearId\`) REFERENCES \`school_years\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`finance_invoices\` ADD CONSTRAINT \`FK_333cf9962ce49747a515e4c6901\` FOREIGN KEY (\`invoiceeId\`) REFERENCES \`finance_invoicees\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`finance_invoices\` ADD CONSTRAINT \`FK_cf9b470740ff24ecc11a0ef058d\` FOREIGN KEY (\`billingScheduleId\`) REFERENCES \`finance_billing_schedules\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`finance_invoice_fees\` ADD CONSTRAINT \`FK_c297b0ccb19e8c56773f556a825\` FOREIGN KEY (\`invoiceId\`) REFERENCES \`finance_invoices\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`finance_invoice_fees\` ADD CONSTRAINT \`FK_7c4e3f38e4ed979dbec46c9554e\` FOREIGN KEY (\`feeId\`) REFERENCES \`finance_fees\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`finance_invoice_fees\` ADD CONSTRAINT \`FK_9dd42c85f0851c2fdaab6c19816\` FOREIGN KEY (\`feeCategoryId\`) REFERENCES \`finance_fee_categories\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`payments\` ADD CONSTRAINT \`FK_43d19956aeab008b49e0804c145\` FOREIGN KEY (\`invoiceId\`) REFERENCES \`finance_invoices\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`payments\` ADD CONSTRAINT \`FK_6992de06f13f67991355e557a05\` FOREIGN KEY (\`recorderPersonId\`) REFERENCES \`people\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`payments\` DROP FOREIGN KEY \`FK_6992de06f13f67991355e557a05\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`payments\` DROP FOREIGN KEY \`FK_43d19956aeab008b49e0804c145\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`finance_invoice_fees\` DROP FOREIGN KEY \`FK_9dd42c85f0851c2fdaab6c19816\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`finance_invoice_fees\` DROP FOREIGN KEY \`FK_7c4e3f38e4ed979dbec46c9554e\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`finance_invoice_fees\` DROP FOREIGN KEY \`FK_c297b0ccb19e8c56773f556a825\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`finance_invoices\` DROP FOREIGN KEY \`FK_cf9b470740ff24ecc11a0ef058d\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`finance_invoices\` DROP FOREIGN KEY \`FK_333cf9962ce49747a515e4c6901\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`finance_invoices\` DROP FOREIGN KEY \`FK_820a4a471811094973e5125ac26\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`finance_invoicees\` DROP FOREIGN KEY \`FK_4e2f42944addd61e49207840b1b\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`finance_fees\` DROP FOREIGN KEY \`FK_a94a3d1f731c18571429026be8f\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`finance_fees\` DROP FOREIGN KEY \`FK_7ed9624f1f66fd9735b514faab0\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`finance_fee_categories\` DROP FOREIGN KEY \`FK_7b55852f29fa764124404212029\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`finance_billing_schedules\` DROP FOREIGN KEY \`FK_abeb5e47640b74aef7dd63235ff\``,
    );
    await queryRunner.query(`DROP TABLE \`payments\``);
    await queryRunner.query(`DROP TABLE \`finance_invoice_fees\``);
    await queryRunner.query(`DROP TABLE \`finance_invoices\``);
    await queryRunner.query(`DROP TABLE \`finance_invoicees\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_78c955df85492d147522276be9\` ON \`finance_fees\``,
    );
    await queryRunner.query(`DROP TABLE \`finance_fees\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_7494dbf8919b8340dcc911f76e\` ON \`finance_fee_categories\``,
    );
    await queryRunner.query(`DROP TABLE \`finance_fee_categories\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_41e1df5dd541626c6efa87bce1\` ON \`finance_billing_schedules\``,
    );
    await queryRunner.query(`DROP TABLE \`finance_billing_schedules\``);
  }
}
