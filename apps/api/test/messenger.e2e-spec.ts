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

describe('Messenger (e2e)', () => {
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

  describe('Messages', () => {
    it('sends a message, resolves the receipt, and lets the recipient confirm it', async () => {
      const { auth, school } = await signUpAdmin();
      const [year] = await schoolYears.findBySchool(school.id);
      const { personId: studentId, auth: studentAuth } = await addPersonLogin(
        school.id,
        'Student',
        'Student',
      );

      const createResponse = await request(app.getHttpServer())
        .post('/messenger')
        .set(auth)
        .send({
          schoolYearId: year.id,
          subject: 'Welcome back',
          body: 'Term starts Monday.',
          targets: [{ targetType: 'Person', targetId: studentId }],
        });
      expect(createResponse.status).toBe(201);
      const message = body<{ id: string }>(createResponse);

      const receiptsResponse = await request(app.getHttpServer())
        .get(`/messenger/${message.id}/receipts`)
        .set(auth);
      expect(receiptsResponse.status).toBe(200);
      expect(body<{ personId: string }[]>(receiptsResponse)).toEqual([
        expect.objectContaining({ personId: studentId }),
      ]);

      const confirmResponse = await request(app.getHttpServer())
        .post(`/messenger/${message.id}/receipts/confirm`)
        .set(studentAuth);
      expect(confirmResponse.status).toBe(201);
      expect(body<{ confirmed: boolean }>(confirmResponse).confirmed).toBe(
        true,
      );
    });

    it('leaves zero orphaned target/receipt rows after deleting a message', async () => {
      const { auth, school } = await signUpAdmin();
      const [year] = await schoolYears.findBySchool(school.id);
      const { personId: studentId } = await addPersonLogin(
        school.id,
        'Student',
        'Student',
      );
      const createResponse = await request(app.getHttpServer())
        .post('/messenger')
        .set(auth)
        .send({
          schoolYearId: year.id,
          subject: 'Notice',
          body: 'Body',
          targets: [{ targetType: 'Person', targetId: studentId }],
        });
      const message = body<{ id: string }>(createResponse);

      const deleteResponse = await request(app.getHttpServer())
        .delete(`/messenger/${message.id}`)
        .set(auth);
      expect(deleteResponse.status).toBe(200);

      const getResponse = await request(app.getHttpServer())
        .get(`/messenger/${message.id}`)
        .set(auth);
      expect(getResponse.status).toBe(404);
    });

    it('rejects a Student sending a message (Admin/Teacher only)', async () => {
      const { school } = await signUpAdmin();
      const [year] = await schoolYears.findBySchool(school.id);
      const { personId: studentId, auth: studentAuth } = await addPersonLogin(
        school.id,
        'Student',
        'Student',
      );

      const response = await request(app.getHttpServer())
        .post('/messenger')
        .set(studentAuth)
        .send({
          schoolYearId: year.id,
          subject: 'Hi',
          body: 'Body',
          targets: [{ targetType: 'Person', targetId: studentId }],
        });

      expect(response.status).toBe(403);
    });

    it('rejects an invalid payload with 400', async () => {
      const { auth, school } = await signUpAdmin();
      const [year] = await schoolYears.findBySchool(school.id);

      const response = await request(app.getHttpServer())
        .post('/messenger')
        .set(auth)
        .send({ schoolYearId: year.id, subject: 'No body or targets' });

      expect(response.status).toBe(400);
    });

    it('returns 404 for a nonexistent message id', async () => {
      const { auth } = await signUpAdmin();

      const response = await request(app.getHttpServer())
        .get(`/messenger/${randomUUID()}`)
        .set(auth);

      expect(response.status).toBe(404);
    });

    it('rejects an unauthenticated request with 401', async () => {
      const response = await request(app.getHttpServer()).get('/messenger');
      expect(response.status).toBe(401);
    });
  });

  describe('Mailing lists', () => {
    it('creates a mailing list and adds a recipient', async () => {
      const { auth, school } = await signUpAdmin();
      const { personId: studentId } = await addPersonLogin(
        school.id,
        'Student',
        'Student',
      );

      const createResponse = await request(app.getHttpServer())
        .post('/messenger/mailing-lists')
        .set(auth)
        .send({ name: 'Football Team' });
      expect(createResponse.status).toBe(201);
      const mailingList = body<{ id: string }>(createResponse);

      const addResponse = await request(app.getHttpServer())
        .post(`/messenger/mailing-lists/${mailingList.id}/recipients`)
        .set(auth)
        .send({ personId: studentId });
      expect(addResponse.status).toBe(201);

      const listResponse = await request(app.getHttpServer())
        .get(`/messenger/mailing-lists/${mailingList.id}/recipients`)
        .set(auth);
      expect(listResponse.status).toBe(200);
      expect(body<{ personId: string }[]>(listResponse)).toEqual([
        expect.objectContaining({ personId: studentId }),
      ]);
    });
  });

  describe('Canned responses', () => {
    it('creates, updates, and deletes a canned response', async () => {
      const { auth } = await signUpAdmin();

      const createResponse = await request(app.getHttpServer())
        .post('/messenger/canned-responses')
        .set(auth)
        .send({ name: 'Absence', body: 'Please explain the absence.' });
      expect(createResponse.status).toBe(201);
      const cannedResponse = body<{ id: string }>(createResponse);

      const updateResponse = await request(app.getHttpServer())
        .patch(`/messenger/canned-responses/${cannedResponse.id}`)
        .set(auth)
        .send({ body: 'Updated template body.' });
      expect(updateResponse.status).toBe(200);

      const deleteResponse = await request(app.getHttpServer())
        .delete(`/messenger/canned-responses/${cannedResponse.id}`)
        .set(auth);
      expect(deleteResponse.status).toBe(200);
    });
  });

  it('is forbidden for an actor with no grants at all', async () => {
    const { school } = await signUpAdmin();
    const noGrantsAuth = await addNoGrantsLogin(school.id);

    const response = await request(app.getHttpServer())
      .get('/messenger')
      .set(noGrantsAuth);

    expect(response.status).toBe(403);
  });
});
