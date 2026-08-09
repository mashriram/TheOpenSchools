import { randomUUID } from 'node:crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { SchoolsRepository } from '../src/modules/school/repositories/schools.repository';
import { SchoolYearsRepository } from '../src/modules/school/repositories/school-years.repository';
import { RolesRepository } from '../src/modules/rbac/repositories/roles.repository';
import { PeopleRepository } from '../src/modules/people/repositories/people.repository';
import { PersonCredentialsRepository } from '../src/modules/people/repositories/person-credentials.repository';
import { PersonRolesRepository } from '../src/modules/people/repositories/person-roles.repository';
import { HashingService } from '../src/modules/auth/hashing.service';

const PASSWORD = 'correct-horse-battery-staple';

function body<T>(response: request.Response): T {
  return response.body as T;
}

describe('Finance (e2e)', () => {
  let app: INestApplication<App>;
  let schools: SchoolsRepository;
  let schoolYears: SchoolYearsRepository;
  let roles: RolesRepository;
  let people: PeopleRepository;
  let personCredentials: PersonCredentialsRepository;
  let personRoles: PersonRolesRepository;
  let hashing: HashingService;
  let createdSchoolIds: string[];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    schools = moduleFixture.get(SchoolsRepository);
    schoolYears = moduleFixture.get(SchoolYearsRepository);
    roles = moduleFixture.get(RolesRepository);
    people = moduleFixture.get(PeopleRepository);
    personCredentials = moduleFixture.get(PersonCredentialsRepository);
    personRoles = moduleFixture.get(PersonRolesRepository);
    hashing = moduleFixture.get(HashingService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    createdSchoolIds = [];
  });

  afterEach(async () => {
    if (createdSchoolIds.length > 0) {
      await schools.delete(createdSchoolIds);
    }
  });

  async function signUpAdmin() {
    const payload = {
      schoolName: 'Greenwood High',
      subdomainSlug: randomUUID().replace(/-/g, '').slice(0, 20),
      adminEmail: `${randomUUID()}@example.com`,
      adminPassword: PASSWORD,
      adminFirstName: 'Ada',
      adminSurname: 'Admin',
    };
    const response = await request(app.getHttpServer())
      .post('/auth/signup')
      .send(payload);
    const school = await schools.findBySlug(payload.subdomainSlug);
    createdSchoolIds.push(school!.id);
    const accessToken = body<{ accessToken: string }>(response).accessToken;
    return {
      school: school!,
      auth: { Authorization: `Bearer ${accessToken}` },
    };
  }

  async function addPersonLogin(
    schoolId: string,
    roleName: string,
    surname: string,
  ) {
    const role = (await roles.findBySchool(schoolId)).find(
      (r) => r.name === roleName,
    )!;
    const email = `${randomUUID()}@example.com`;
    const person = await people.save(
      people.create({ schoolId, surname, firstName: 'Test', email }),
    );
    await personRoles.save(
      personRoles.create({
        personId: person.id,
        roleId: role.id,
        isPrimary: true,
      }),
    );
    await personCredentials.save(
      personCredentials.create({
        personId: person.id,
        schoolId,
        username: email,
        passwordHash: await hashing.hashPassword(PASSWORD),
      }),
    );
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        schoolSlug: (await schools.findOne({ where: { id: schoolId } }))!
          .subdomainSlug,
        email,
        password: PASSWORD,
      });
    const accessToken = body<{ accessToken: string }>(
      loginResponse,
    ).accessToken;
    return {
      personId: person.id,
      auth: { Authorization: `Bearer ${accessToken}` },
    };
  }

  async function addNoGrantsLogin(schoolId: string) {
    const bareRole = await roles.save(
      roles.create({
        schoolId,
        category: 'Staff',
        name: 'No Grants',
        shortName: 'NoGrt',
        description: 'Has no permissions at all',
        restriction: 'None',
        type: 'Additional',
      }),
    );
    const email = `${randomUUID()}@example.com`;
    const person = await people.save(
      people.create({ schoolId, surname: 'Bystander', firstName: 'Bo', email }),
    );
    await personRoles.save(
      personRoles.create({
        personId: person.id,
        roleId: bareRole.id,
        isPrimary: true,
      }),
    );
    await personCredentials.save(
      personCredentials.create({
        personId: person.id,
        schoolId,
        username: email,
        passwordHash: await hashing.hashPassword(PASSWORD),
      }),
    );
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        schoolSlug: (await schools.findOne({ where: { id: schoolId } }))!
          .subdomainSlug,
        email,
        password: PASSWORD,
      });
    const accessToken = body<{ accessToken: string }>(
      loginResponse,
    ).accessToken;
    return { Authorization: `Bearer ${accessToken}` };
  }

  it('supports the full invoice lifecycle, including a discount line and a full refund', async () => {
    const { auth, school } = await signUpAdmin();
    const [year] = await schoolYears.findBySchool(school.id);
    const { personId: studentId } = await addPersonLogin(
      school.id,
      'Student',
      'Student',
    );

    const categoryResponse = await request(app.getHttpServer())
      .post('/finance/fee-categories')
      .set(auth)
      .send({ name: 'Tuition', shortName: 'TUIT' });
    expect(categoryResponse.status).toBe(201);
    const category = body<{ id: string }>(categoryResponse);

    const invoiceeResponse = await request(app.getHttpServer())
      .post('/finance/invoicees')
      .set(auth)
      .send({ studentPersonId: studentId, invoiceTo: 'Family' });
    expect(invoiceeResponse.status).toBe(201);
    const invoicee = body<{ id: string }>(invoiceeResponse);

    const invoiceResponse = await request(app.getHttpServer())
      .post('/finance/invoices')
      .set(auth)
      .send({ schoolYearId: year.id, invoiceeId: invoicee.id });
    expect(invoiceResponse.status).toBe(201);
    const invoice = body<{ id: string }>(invoiceResponse);

    const feeLineResponse = await request(app.getHttpServer())
      .post(`/finance/invoices/${invoice.id}/fees`)
      .set(auth)
      .send({
        feeType: 'Standard',
        name: 'Term 1 Tuition',
        feeCategoryId: category.id,
        amount: 500,
      });
    expect(feeLineResponse.status).toBe(201);

    const discountResponse = await request(app.getHttpServer())
      .post(`/finance/invoices/${invoice.id}/fees`)
      .set(auth)
      .send({ feeType: 'Discount', name: 'Sibling scholarship', amount: -100 });
    expect(discountResponse.status).toBe(201);

    const badDiscountResponse = await request(app.getHttpServer())
      .post(`/finance/invoices/${invoice.id}/fees`)
      .set(auth)
      .send({ feeType: 'Discount', name: 'Bad discount', amount: 100 });
    expect(badDiscountResponse.status).toBe(400);

    const paymentResponse = await request(app.getHttpServer())
      .post(`/finance/invoices/${invoice.id}/payments`)
      .set(auth)
      .send({ amount: 400 });
    expect(paymentResponse.status).toBe(201);

    const paidInvoiceResponse = await request(app.getHttpServer())
      .get(`/finance/invoices/${invoice.id}`)
      .set(auth);
    expect(body<{ status: string }>(paidInvoiceResponse).status).toBe('Paid');

    const refundResponse = await request(app.getHttpServer())
      .post(`/finance/invoices/${invoice.id}/payments`)
      .set(auth)
      .send({ type: 'Refund', amount: -400 });
    expect(refundResponse.status).toBe(201);

    const refundedInvoiceResponse = await request(app.getHttpServer())
      .get(`/finance/invoices/${invoice.id}`)
      .set(auth);
    expect(body<{ status: string }>(refundedInvoiceResponse).status).toBe(
      'Refunded',
    );
  });

  it('is forbidden for an actor with no grants at all', async () => {
    const { school } = await signUpAdmin();
    const noGrantsAuth = await addNoGrantsLogin(school.id);

    const response = await request(app.getHttpServer())
      .get('/finance/fee-categories')
      .set(noGrantsAuth);

    expect(response.status).toBe(403);
  });

  it('rejects an unauthenticated request with 401', async () => {
    const response = await request(app.getHttpServer()).get(
      '/finance/fee-categories',
    );
    expect(response.status).toBe(401);
  });

  describe('Stripe webhook - no auth guard, signature-verified instead', () => {
    it('rejects a request with no signature header', async () => {
      const response = await request(app.getHttpServer())
        .post('/finance/webhooks/stripe')
        .send({ type: 'checkout.session.completed' });

      expect(response.status).toBe(400);
    });
  });
});
