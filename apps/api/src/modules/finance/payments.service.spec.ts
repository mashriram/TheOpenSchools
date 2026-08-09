import { randomUUID } from 'node:crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { NotFoundException } from '@nestjs/common';
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
import { PaymentsService } from './payments.service';

describe('PaymentsService (integration)', () => {
  let module: TestingModule;
  let schools: SchoolsRepository;
  let schoolYears: SchoolYearsRepository;
  let people: PeopleRepository;
  let invoicees: FinanceInvoiceesService;
  let invoices: FinanceInvoicesService;
  let service: PaymentsService;
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
    service = module.get(PaymentsService);
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
    const invoice = await invoices.create(school.id, {
      schoolYearId: schoolYear.id,
      invoiceeId: invoicee.id,
    });
    return { school, invoice, recorder };
  }

  it('records a manual cash payment', async () => {
    const { school, invoice, recorder } = await setUp();

    const payment = await service.record(school.id, invoice.id, recorder.id, {
      type: 'Cash',
      amount: 100,
    });

    expect(payment.type).toBe('Cash');
    expect(payment.recorderPersonId).toBe(recorder.id);
    expect(payment.status).toBe('Complete');
  });

  it('records a refund as a negative-amount row', async () => {
    const { school, invoice, recorder } = await setUp();
    await service.record(school.id, invoice.id, recorder.id, { amount: 200 });

    const refund = await service.record(school.id, invoice.id, recorder.id, {
      type: 'Refund',
      amount: -200,
    });

    expect(refund.amount).toBe(-200);
    const list = await service.list(school.id, invoice.id);
    expect(list).toHaveLength(2);
  });

  it('throws NotFound for a payment belonging to a different school', async () => {
    const { school, invoice, recorder } = await setUp();
    const other = await setUp();
    const payment = await service.record(school.id, invoice.id, recorder.id, {
      amount: 100,
    });

    await expect(service.getOwned(other.school.id, payment.id)).rejects.toThrow(
      NotFoundException,
    );
  });
});
