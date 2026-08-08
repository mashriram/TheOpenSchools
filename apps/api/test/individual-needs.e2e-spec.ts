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

describe('Individual Needs (e2e)', () => {
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

  describe('Summary/detail read-side gate - the real Gibbon bug fix', () => {
    it('never exposes narrative content to a default Teacher role, only descriptors', async () => {
      const { auth, school } = await signUpAdmin();
      const { personId: studentId } = await addPersonLogin(
        school.id,
        'Student',
        'Student',
      );
      await request(app.getHttpServer())
        .put(`/individual-needs/people/${studentId}`)
        .set(auth)
        .send({
          notes: 'Confidential safeguarding note',
          strategies: 'Extra time',
        });
      await request(app.getHttpServer())
        .put(`/individual-needs/people/${studentId}/descriptors`)
        .set(auth)
        .send({ descriptor: 'SEN', level: 'High' });
      const { auth: teacherAuth } = await addPersonLogin(
        school.id,
        'Teacher',
        'Teacher',
      );

      const response = await request(app.getHttpServer())
        .get(`/individual-needs/people/${studentId}`)
        .set(teacherAuth);

      expect(response.status).toBe(200);
      const payload = body<Record<string, unknown>>(response);
      expect(payload).not.toHaveProperty('notes');
      expect(payload).not.toHaveProperty('strategies');
      expect(payload).not.toHaveProperty('targets');
      expect(payload.descriptors).toEqual([
        expect.objectContaining({ descriptor: 'SEN', level: 'High' }),
      ]);
    });

    it('exposes full narrative content to the Admin role, which holds detail.view', async () => {
      const { auth, school } = await signUpAdmin();
      const { personId: studentId } = await addPersonLogin(
        school.id,
        'Student',
        'Student',
      );
      await request(app.getHttpServer())
        .put(`/individual-needs/people/${studentId}`)
        .set(auth)
        .send({ notes: 'Confidential safeguarding note' });

      const response = await request(app.getHttpServer())
        .get(`/individual-needs/people/${studentId}`)
        .set(auth);

      expect(response.status).toBe(200);
      expect(body<{ notes: string }>(response).notes).toBe(
        'Confidential safeguarding note',
      );
    });

    it('is forbidden for an actor with no grants at all', async () => {
      const { school } = await signUpAdmin();
      const { personId: studentId } = await addPersonLogin(
        school.id,
        'Student',
        'Student',
      );
      const noGrantsAuth = await addNoGrantsLogin(school.id);

      const response = await request(app.getHttpServer())
        .get(`/individual-needs/people/${studentId}`)
        .set(noGrantsAuth);

      expect(response.status).toBe(403);
    });

    it('rejects an unauthenticated request with 401', async () => {
      const response = await request(app.getHttpServer()).get(
        `/individual-needs/people/${randomUUID()}`,
      );
      expect(response.status).toBe(401);
    });
  });

  describe('Investigations', () => {
    it('creates and updates an investigation workflow', async () => {
      const { auth, school } = await signUpAdmin();
      const [year] = await schoolYears.findBySchool(school.id);
      const { personId: studentId } = await addPersonLogin(
        school.id,
        'Student',
        'Student',
      );

      const createResponse = await request(app.getHttpServer())
        .post('/individual-needs/investigations')
        .set(auth)
        .send({
          schoolYearId: year.id,
          studentPersonId: studentId,
          date: '2026-09-01',
          reason: 'Repeated lateness',
        });
      expect(createResponse.status).toBe(201);
      const investigation = body<{ id: string }>(createResponse);

      const updateResponse = await request(app.getHttpServer())
        .patch(`/individual-needs/investigations/${investigation.id}`)
        .set(auth)
        .send({ status: 'Investigation' });
      expect(updateResponse.status).toBe(200);

      const contributionResponse = await request(app.getHttpServer())
        .post(
          `/individual-needs/investigations/${investigation.id}/contributions`,
        )
        .set(auth)
        .send({ personId: studentId });
      expect(contributionResponse.status).toBe(201);
    });
  });
});
