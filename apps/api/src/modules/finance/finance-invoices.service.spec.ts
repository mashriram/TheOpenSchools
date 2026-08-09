import { randomUUID } from 'node:crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { SchoolModule } from '../school/school.module';
import { PeopleModule } from '../people/people.module';
import { RbacModule } from '../rbac/rbac.module';
import { FinanceModule } from './finance.module';
import { SchoolsRepository } from '../school/repositories/schools.repository';
import { SchoolYearsRepository } from '../school/repositories/school-years.repository';
import { PeopleRepository } from '../people/repositories/people.repository';
import { FinanceInvoiceesService } from './finance-invoicees.service';
import { FinanceFeeCategoriesService } from './finance-fee-categories.service';
import { FinanceInvoicesService } from './finance-invoices.service';
import { FinanceInvoiceFeesService } from './finance-invoice-fees.service';
import { PaymentsService } from './payments.service';

describe('FinanceInvoicesService (integration)', () => {
  let module: TestingModule;
  let schools: SchoolsRepository;
  let schoolYears: SchoolYearsRepository;
  let people: PeopleRepository;
  let invoicees: FinanceInvoiceesService;
  let feeCategories: FinanceFeeCategoriesService;
  let service: FinanceInvoicesService;
  let invoiceFees: FinanceInvoiceFeesService;
  let payments: PaymentsService;
  let createdSchoolIds: string[];

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        DatabaseModule,
        SchoolModule,
        PeopleModule,
        RbacModule,
        FinanceModule,
      ],
    }).compile();

    schools = module.get(SchoolsRepository);
    schoolYears = module.get(SchoolYearsRepository);
    people = module.get(PeopleRepository);
    invoicees = module.get(FinanceInvoiceesService);
    feeCategories = module.get(FinanceFeeCategoriesService);
    service = module.get(FinanceInvoicesService);
    invoiceFees = module.get(FinanceInvoiceFeesService);
    payments = module.get(PaymentsService);
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(() => {
    createdSchoolIds = [];
  });

  afterEach(async () => {
    if (createdSchoolIds.length > 0) {
      await schools.delete(createdSchoolIds);
    }
  });

  async function setUp() {
    const school = await schools.save(
      schools.create({ name: 'Test School', subdomainSlug: randomUUID() }),
    );
    createdSchoolIds.push(school.id);
    const schoolYear = await schoolYears.save(
      schoolYears.create({
        schoolId: school.id,
        name: '2024-25',
        sequenceNumber: 1,
      }),
    );
    const student = await people.save(
      people.create({
        schoolId: school.id,
        surname: 'Student',
        firstName: 'Sam',
      }),
    );
    const recorder = await people.save(
      people.create({
        schoolId: school.id,
        surname: 'Admin',
        firstName: 'Ada',
      }),
    );
    const invoicee = await invoicees.create(school.id, {
      studentPersonId: student.id,
      invoiceTo: 'Family',
    });
    const category = await feeCategories.create(school.id, {
      name: 'Tuition',
      shortName: 'TUIT',
    });
    const invoice = await service.create(school.id, {
      schoolYearId: schoolYear.id,
      invoiceeId: invoicee.id,
    });
    return {
      school,
      schoolYear,
      student,
      recorder,
      invoicee,
      category,
      invoice,
    };
  }

  it('rejects a schoolYearId from a different school with 400', async () => {
    const { school, invoicee } = await setUp();
    const other = await setUp();

    await expect(
      service.create(school.id, {
        schoolYearId: other.schoolYear.id,
        invoiceeId: invoicee.id,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws NotFound for an invoice belonging to a different school', async () => {
    const { invoice } = await setUp();
    const other = await setUp();

    await expect(service.getOwned(other.school.id, invoice.id)).rejects.toThrow(
      NotFoundException,
    );
  });

  describe('recalculatePaidAmount', () => {
    it('marks the invoice Paid once payments cover the full total', async () => {
      const { school, invoice, category, recorder } = await setUp();
      await invoiceFees.create(school.id, invoice.id, {
        feeType: 'Standard',
        name: 'Term 1 Tuition',
        feeCategoryId: category.id,
        amount: 500,
      });

      await payments.record(school.id, invoice.id, recorder.id, {
        amount: 500,
      });

      const updated = await service.getOwned(school.id, invoice.id);
      expect(updated.status).toBe('Paid');
      expect(Number(updated.paidAmount)).toBe(500);
    });

    it('marks the invoice Paid - Partial when only some of the total is paid', async () => {
      const { school, invoice, category, recorder } = await setUp();
      await invoiceFees.create(school.id, invoice.id, {
        feeType: 'Standard',
        name: 'Term 1 Tuition',
        feeCategoryId: category.id,
        amount: 500,
      });

      await payments.record(school.id, invoice.id, recorder.id, {
        amount: 200,
      });

      const updated = await service.getOwned(school.id, invoice.id);
      expect(updated.status).toBe('Paid - Partial');
    });

    it('applies a Discount line to reduce the total needed to reach Paid', async () => {
      const { school, invoice, category, recorder } = await setUp();
      await invoiceFees.create(school.id, invoice.id, {
        feeType: 'Standard',
        name: 'Term 1 Tuition',
        feeCategoryId: category.id,
        amount: 500,
      });
      await invoiceFees.create(school.id, invoice.id, {
        feeType: 'Discount',
        name: 'Sibling scholarship',
        amount: -100,
      });

      await payments.record(school.id, invoice.id, recorder.id, {
        amount: 400,
      });

      const updated = await service.getOwned(school.id, invoice.id);
      expect(updated.status).toBe('Paid');
    });

    it('marks the invoice Refunded when net payments go negative', async () => {
      const { school, invoice, category, recorder } = await setUp();
      await invoiceFees.create(school.id, invoice.id, {
        feeType: 'Standard',
        name: 'Term 1 Tuition',
        feeCategoryId: category.id,
        amount: 500,
      });
      await payments.record(school.id, invoice.id, recorder.id, {
        amount: 500,
      });

      await payments.record(school.id, invoice.id, recorder.id, {
        amount: -500,
        type: 'Refund',
      });

      const updated = await service.getOwned(school.id, invoice.id);
      expect(updated.status).toBe('Refunded');
      expect(Number(updated.paidAmount)).toBe(0);
    });

    it('ignores a Failure-status payment when computing paidAmount', async () => {
      const { school, invoice, category, recorder } = await setUp();
      await invoiceFees.create(school.id, invoice.id, {
        feeType: 'Standard',
        name: 'Term 1 Tuition',
        feeCategoryId: category.id,
        amount: 500,
      });

      await payments.record(school.id, invoice.id, recorder.id, {
        amount: 500,
        status: 'Failure',
      });

      const updated = await service.getOwned(school.id, invoice.id);
      expect(updated.status).toBe('Pending');
      expect(Number(updated.paidAmount)).toBe(0);
    });
  });
});
