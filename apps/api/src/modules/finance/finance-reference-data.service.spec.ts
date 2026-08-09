import { randomUUID } from 'node:crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { SchoolModule } from '../school/school.module';
import { PeopleModule } from '../people/people.module';
import { RbacModule } from '../rbac/rbac.module';
import { FinanceModule } from './finance.module';
import { SchoolsRepository } from '../school/repositories/schools.repository';
import { SchoolYearsRepository } from '../school/repositories/school-years.repository';
import { PeopleRepository } from '../people/repositories/people.repository';
import { FinanceFeeCategoriesService } from './finance-fee-categories.service';
import { FinanceFeesService } from './finance-fees.service';
import { FinanceBillingSchedulesService } from './finance-billing-schedules.service';
import { FinanceInvoiceesService } from './finance-invoicees.service';

describe('Finance reference data services (integration)', () => {
  let module: TestingModule;
  let schools: SchoolsRepository;
  let schoolYears: SchoolYearsRepository;
  let people: PeopleRepository;
  let feeCategories: FinanceFeeCategoriesService;
  let fees: FinanceFeesService;
  let billingSchedules: FinanceBillingSchedulesService;
  let invoicees: FinanceInvoiceesService;
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
    feeCategories = module.get(FinanceFeeCategoriesService);
    fees = module.get(FinanceFeesService);
    billingSchedules = module.get(FinanceBillingSchedulesService);
    invoicees = module.get(FinanceInvoiceesService);
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
    return { school, schoolYear, student };
  }

  describe('FinanceFeeCategoriesService', () => {
    it('rejects a duplicate name within the same school as a clean 409', async () => {
      const { school } = await setUp();
      await feeCategories.create(school.id, {
        name: 'Tuition',
        shortName: 'TUIT',
      });

      await expect(
        feeCategories.create(school.id, { name: 'Tuition', shortName: 'TUI2' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('FinanceFeesService', () => {
    it('creates a fee referencing a category, with a real decimal amount round-trip', async () => {
      const { school, schoolYear } = await setUp();
      const category = await feeCategories.create(school.id, {
        name: 'Tuition',
        shortName: 'TUIT',
      });

      const fee = await fees.create(school.id, schoolYear.id, {
        name: 'Term 1 Tuition',
        shortName: 'T1',
        feeCategoryId: category.id,
        amount: 999.99,
      });

      expect(fee.amount).toBe(999.99);
    });

    it('rejects a feeCategoryId from a different school with 400', async () => {
      const { school, schoolYear } = await setUp();
      const other = await setUp();
      const otherCategory = await feeCategories.create(other.school.id, {
        name: 'Tuition',
        shortName: 'TUIT',
      });

      await expect(
        fees.create(school.id, schoolYear.id, {
          name: 'Term 1',
          shortName: 'T1',
          feeCategoryId: otherCategory.id,
          amount: 100,
        }),
      ).rejects.toThrow();
    });
  });

  describe('FinanceBillingSchedulesService', () => {
    it('throws NotFound updating a schedule belonging to a different school', async () => {
      const { school, schoolYear } = await setUp();
      const other = await setUp();
      const schedule = await billingSchedules.create(school.id, schoolYear.id, {
        name: 'Termly',
      });

      await expect(
        billingSchedules.update(other.school.id, schedule.id, {
          name: 'Hijacked',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('FinanceInvoiceesService', () => {
    it('creates a Family invoicee for a student', async () => {
      const { school, student } = await setUp();

      const invoicee = await invoicees.create(school.id, {
        studentPersonId: student.id,
        invoiceTo: 'Family',
      });

      expect(invoicee.invoiceTo).toBe('Family');
      expect(
        await invoicees.listForStudent(school.id, student.id),
      ).toHaveLength(1);
    });

    it('creates a Company invoicee with company contact details', async () => {
      const { school, student } = await setUp();

      const invoicee = await invoicees.create(school.id, {
        studentPersonId: student.id,
        invoiceTo: 'Company',
        companyName: 'Acme Sponsorship Ltd',
        companyEmail: 'billing@acme.example.com',
        companyAll: true,
      });

      expect(invoicee.companyName).toBe('Acme Sponsorship Ltd');
      expect(invoicee.companyAll).toBe(true);
    });
  });
});
