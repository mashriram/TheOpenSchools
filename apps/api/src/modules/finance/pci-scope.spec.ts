import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { DatabaseModule } from '../../database/database.module';
import { PeopleModule } from '../people/people.module';
import { SchoolModule } from '../school/school.module';
import { RbacModule } from '../rbac/rbac.module';
import { FinanceModule } from './finance.module';

/**
 * Cheap, structural insurance against future drift (plan §M21 Tests): no
 * entity in this module may ever grow a column shaped like raw cardholder
 * data or bank account details - see Payment's doc comment for why this
 * schema is deliberately PCI-SAQ-A-eligible by design (Stripe Checkout's
 * hosted page collects the card, PurpleSchools never sees it). This scans
 * real TypeORM metadata, not a hand-maintained file list, so it actually
 * catches a future column addition.
 */
const FORBIDDEN_COLUMN_NAME_PATTERNS = [
  /card/i,
  /cvv/i,
  /cvc/i,
  /pan\b/i,
  /expiry/i,
  /expiration/i,
  /account.?number/i,
  /routing.?number/i,
  /\biban\b/i,
  /sort.?code/i,
];

describe('Finance PCI scope (structural)', () => {
  let module: TestingModule;
  let dataSource: DataSource;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        DatabaseModule,
        PeopleModule,
        SchoolModule,
        RbacModule,
        FinanceModule,
      ],
    }).compile();

    dataSource = module.get(DataSource);
  });

  afterAll(async () => {
    await module.close();
  });

  it('has no column anywhere in the Finance module shaped like raw cardholder or bank data', () => {
    const financeTableNames = new Set([
      'finance_fee_categories',
      'finance_fees',
      'finance_billing_schedules',
      'finance_invoicees',
      'finance_invoices',
      'finance_invoice_fees',
      'payments',
    ]);

    const financeMetadatas = dataSource.entityMetadatas.filter((metadata) =>
      financeTableNames.has(metadata.tableName),
    );
    expect(financeMetadatas.length).toBe(financeTableNames.size);

    const offenders: string[] = [];
    for (const metadata of financeMetadatas) {
      for (const column of metadata.columns) {
        if (
          FORBIDDEN_COLUMN_NAME_PATTERNS.some((pattern) =>
            pattern.test(column.propertyName),
          )
        ) {
          offenders.push(`${metadata.tableName}.${column.propertyName}`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });
});
