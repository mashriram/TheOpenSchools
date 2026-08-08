import { randomUUID } from 'node:crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { SchoolsRepository } from '../src/modules/school/repositories/schools.repository';
import { RolesRepository } from '../src/modules/rbac/repositories/roles.repository';
import { PeopleRepository } from '../src/modules/people/repositories/people.repository';
import { PersonCredentialsRepository } from '../src/modules/people/repositories/person-credentials.repository';
import { PersonRolesRepository } from '../src/modules/people/repositories/person-roles.repository';
import { AuditLogsRepository } from '../src/modules/compliance/repositories/audit-logs.repository';
import { HashingService } from '../src/modules/auth/hashing.service';

const PASSWORD = 'correct-horse-battery-staple';

function body<T>(response: request.Response): T {
  return response.body as T;
}

describe('GDPR (e2e)', () => {
  let app: INestApplication<App>;
  let schools: SchoolsRepository;
  let roles: RolesRepository;
  let people: PeopleRepository;
  let personCredentials: PersonCredentialsRepository;
  let personRoles: PersonRolesRepository;
  let auditLogs: AuditLogsRepository;
  let hashing: HashingService;
  let createdSchoolIds: string[];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    schools = moduleFixture.get(SchoolsRepository);
    roles = moduleFixture.get(RolesRepository);
    people = moduleFixture.get(PeopleRepository);
    personCredentials = moduleFixture.get(PersonCredentialsRepository);
    personRoles = moduleFixture.get(PersonRolesRepository);
    auditLogs = moduleFixture.get(AuditLogsRepository);
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
    const accessToken = body<{ accessToken: string; person: { id: string } }>(
      response,
    ).accessToken;
    const personId = body<{ person: { id: string } }>(response).person.id;
    return {
      school: school!,
      personId,
      auth: { Authorization: `Bearer ${accessToken}` },
    };
  }

  async function addStudentLogin(schoolId: string) {
    const studentRole = (await roles.findBySchool(schoolId)).find(
      (r) => r.name === 'Student',
    )!;
    const email = `${randomUUID()}@example.com`;
    const person = await people.save(
      people.create({ schoolId, surname: 'Student', firstName: 'Stu', email }),
    );
    await personRoles.save(
      personRoles.create({
        personId: person.id,
        roleId: studentRole.id,
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

  describe('GET /gdpr/export/me', () => {
    it('lets any authenticated person export their own data', async () => {
      const { auth, personId } = await signUpAdmin();

      const response = await request(app.getHttpServer())
        .get('/gdpr/export/me')
        .set(auth);

      expect(response.status).toBe(200);
      expect(body<{ person: { id: string } }>(response).person.id).toBe(
        personId,
      );
    });
  });

  describe('GET /gdpr/export/:personId', () => {
    it('lets an admin export on behalf of another person in the same school', async () => {
      const { school, auth } = await signUpAdmin();
      const { personId: studentPersonId } = await addStudentLogin(school.id);

      const response = await request(app.getHttpServer())
        .get(`/gdpr/export/${studentPersonId}`)
        .set(auth);

      expect(response.status).toBe(200);
      expect(body<{ person: { id: string } }>(response).person.id).toBe(
        studentPersonId,
      );
    });

    it('is forbidden for a Student trying to export someone else', async () => {
      const { school, auth } = await signUpAdmin();
      const { auth: studentAuth } = await addStudentLogin(school.id);
      const secondPersonResponse = await request(app.getHttpServer())
        .post('/people')
        .set(auth)
        .send({ surname: 'Other', firstName: 'Per' });
      const otherPersonId = body<{ id: string }>(secondPersonResponse).id;

      const response = await request(app.getHttpServer())
        .get(`/gdpr/export/${otherPersonId}`)
        .set(studentAuth);

      expect(response.status).toBe(403);
    });
  });

  describe('POST /gdpr/erasure-request/me', () => {
    it('erases the caller and logs them out of future logins', async () => {
      const { school, auth } = await signUpAdmin();
      const { personId: studentPersonId, auth: studentAuth } =
        await addStudentLogin(school.id);

      const response = await request(app.getHttpServer())
        .post('/gdpr/erasure-request/me')
        .set(studentAuth);

      expect(response.status).toBe(204);
      const person = await people.findOne({ where: { id: studentPersonId } });
      expect(person!.surname).toBe('[ERASED]');
      const auditRows = await auditLogs.findByEntity('Person', studentPersonId);
      expect(auditRows.some((r) => r.action === 'erase')).toBe(true);
      void auth;
    });
  });

  describe('POST /gdpr/erasure-request/:personId', () => {
    it('is forbidden for a Student erasing someone else', async () => {
      const { school, auth } = await signUpAdmin();
      const { auth: studentAuth } = await addStudentLogin(school.id);
      const secondPersonResponse = await request(app.getHttpServer())
        .post('/people')
        .set(auth)
        .send({ surname: 'Other', firstName: 'Per' });
      const otherPersonId = body<{ id: string }>(secondPersonResponse).id;

      const response = await request(app.getHttpServer())
        .post(`/gdpr/erasure-request/${otherPersonId}`)
        .set(studentAuth);

      expect(response.status).toBe(403);
    });

    it('lets an admin erase on behalf of another person', async () => {
      const { school, auth } = await signUpAdmin();
      const { personId: studentPersonId } = await addStudentLogin(school.id);

      const response = await request(app.getHttpServer())
        .post(`/gdpr/erasure-request/${studentPersonId}`)
        .set(auth);

      expect(response.status).toBe(204);
      const person = await people.findOne({ where: { id: studentPersonId } });
      expect(person!.erasedAt).not.toBeNull();
    });
  });

  describe('POST /gdpr/consent', () => {
    it("records the caller's own consent", async () => {
      const { auth } = await signUpAdmin();

      const response = await request(app.getHttpServer())
        .post('/gdpr/consent')
        .set(auth)
        .send({ policyVersion: '2026-01' });

      expect(response.status).toBe(201);
      expect(body<{ policyVersion: string }>(response).policyVersion).toBe(
        '2026-01',
      );
    });

    it('rejects a missing policyVersion with 400', async () => {
      const { auth } = await signUpAdmin();

      const response = await request(app.getHttpServer())
        .post('/gdpr/consent')
        .set(auth)
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('not-found handling', () => {
    it('returns 404 exporting a syntactically-valid but nonexistent personId', async () => {
      const { auth } = await signUpAdmin();

      const response = await request(app.getHttpServer())
        .get(`/gdpr/export/${randomUUID()}`)
        .set(auth);

      expect(response.status).toBe(404);
    });

    it('returns 404 exporting a personId that belongs to a different school', async () => {
      const { auth } = await signUpAdmin();
      const { personId: otherSchoolPersonId } = await signUpAdmin();

      const response = await request(app.getHttpServer())
        .get(`/gdpr/export/${otherSchoolPersonId}`)
        .set(auth);

      expect(response.status).toBe(404);
    });

    it('returns 400 for a malformed personId', async () => {
      const { auth } = await signUpAdmin();

      const response = await request(app.getHttpServer())
        .get('/gdpr/export/not-a-uuid')
        .set(auth);

      expect(response.status).toBe(400);
    });

    it('returns 404 requesting erasure for a nonexistent personId', async () => {
      const { auth } = await signUpAdmin();

      const response = await request(app.getHttpServer())
        .post(`/gdpr/erasure-request/${randomUUID()}`)
        .set(auth);

      expect(response.status).toBe(404);
    });
  });

  it('rejects unauthenticated requests to every /gdpr route with 401', async () => {
    const exportResponse = await request(app.getHttpServer()).get(
      '/gdpr/export/me',
    );
    const erasureResponse = await request(app.getHttpServer()).post(
      '/gdpr/erasure-request/me',
    );
    const consentResponse = await request(app.getHttpServer())
      .post('/gdpr/consent')
      .send({ policyVersion: '2026-01' });

    expect(exportResponse.status).toBe(401);
    expect(erasureResponse.status).toBe(401);
    expect(consentResponse.status).toBe(401);
  });
});
