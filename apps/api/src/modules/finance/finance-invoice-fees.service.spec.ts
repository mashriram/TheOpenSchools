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
import { FinanceInvoicesService } from './finance-invoices.service';
import { FinanceInvoiceFeesService } from './finance-invoice-fees.service';

describe('FinanceInvoiceFeesService (integration)', () => {
  let module: TestingModule;
  let schools: SchoolsRepository;
  let schoolYears: SchoolYearsRepository;
  let people: PeopleRepository;
  let invoicees: FinanceInvoiceesService;
  let invoices: FinanceInvoicesService;
  let service: FinanceInvoiceFeesService;
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
    invoices = module.get(FinanceInvoicesService);
    service = module.get(FinanceInvoiceFeesService);
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
    const invoicee = await invoicees.create(school.id, {
      studentPersonId: student.id,
      invoiceTo: 'Family',
    });
    const invoice = await invoices.create(school.id, {
      schoolYearId: schoolYear.id,
      invoiceeId: invoicee.id,
    });
    return { school, invoice };
  }

  it('creates an AdHoc line item and recalculates the invoice total', async () => {
    const { school, invoice } = await setUp();

    const line = await service.create(school.id, invoice.id, {
      feeType: 'AdHoc',
      name: 'Field trip',
      amount: 50,
    });

    expect(line.amount).toBe(50);
    const updated = await invoices.getOwned(school.id, invoice.id);
    expect(Number(updated.paidAmount)).toBe(0);
  });

  it('rejects a Discount line with a positive amount', async () => {
    const { school, invoice } = await setUp();

    await expect(
      service.create(school.id, invoice.id, {
        feeType: 'Discount',
        name: 'Scholarship',
        amount: 50,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects a Standard/AdHoc line with a negative amount', async () => {
    const { school, invoice } = await setUp();

    await expect(
      service.create(school.id, invoice.id, {
        feeType: 'AdHoc',
        name: 'Field trip',
        amount: -50,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('accepts a Discount line with a negative amount', async () => {
    const { school, invoice } = await setUp();

    const line = await service.create(school.id, invoice.id, {
      feeType: 'Discount',
      name: 'Scholarship',
      amount: -50,
    });

    expect(line.amount).toBe(-50);
  });

  it('removes a line item and recalculates', async () => {
    const { school, invoice } = await setUp();
    const line = await service.create(school.id, invoice.id, {
      feeType: 'AdHoc',
      name: 'Field trip',
      amount: 50,
    });

    await service.remove(school.id, line.id);

    expect(await service.list(school.id, invoice.id)).toHaveLength(0);
  });

  it('throws NotFound removing a line item belonging to a different school', async () => {
    const { school, invoice } = await setUp();
    const other = await setUp();
    const line = await service.create(school.id, invoice.id, {
      feeType: 'AdHoc',
      name: 'Field trip',
      amount: 50,
    });

    await expect(service.remove(other.school.id, line.id)).rejects.toThrow(
      NotFoundException,
    );
  });
});
