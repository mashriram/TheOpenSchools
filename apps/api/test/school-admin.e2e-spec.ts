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

describe('School Admin (e2e)', () => {
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

  /** Signs up a fresh school, returning its admin's access token and id. */
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
      accessToken,
      auth: { Authorization: `Bearer ${accessToken}` },
    };
  }

  /** Adds a Teacher-only login (no schoolAdmin.* grants) to an existing school. */
  async function addTeacherLogin(schoolId: string) {
    const teacherRole = (await roles.findBySchool(schoolId)).find(
      (r) => r.name === 'Teacher',
    )!;
    const email = `${randomUUID()}@example.com`;
    const person = await people.save(
      people.create({ schoolId, surname: 'Teacher', firstName: 'Tom', email }),
    );
    await personRoles.save(
      personRoles.create({
        personId: person.id,
        roleId: teacherRole.id,
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

  describe('Houses', () => {
    it('supports the full CRUD lifecycle for an admin', async () => {
      const { auth } = await signUpAdmin();

      const createResponse = await request(app.getHttpServer())
        .post('/school-admin/houses')
        .set(auth)
        .send({ name: 'Griffindor', shortName: 'GRF' });
      expect(createResponse.status).toBe(201);
      const house = body<{ id: string }>(createResponse);

      const listResponse = await request(app.getHttpServer())
        .get('/school-admin/houses')
        .set(auth);
      expect(listResponse.status).toBe(200);
      expect(body<{ name: string }[]>(listResponse)).toHaveLength(1);

      const updateResponse = await request(app.getHttpServer())
        .patch(`/school-admin/houses/${house.id}`)
        .set(auth)
        .send({ name: 'Gryffindor' });
      expect(updateResponse.status).toBe(200);
      expect(body<{ name: string }>(updateResponse).name).toBe('Gryffindor');

      const deleteResponse = await request(app.getHttpServer())
        .delete(`/school-admin/houses/${house.id}`)
        .set(auth);
      expect(deleteResponse.status).toBe(200);
    });

    it('is forbidden for a Teacher', async () => {
      const { school } = await signUpAdmin();
      const teacherAuth = await addTeacherLogin(school.id);

      const response = await request(app.getHttpServer())
        .get('/school-admin/houses')
        .set(teacherAuth);

      expect(response.status).toBe(403);
    });

    it('rejects an unauthenticated request', async () => {
      const response = await request(app.getHttpServer()).get(
        '/school-admin/houses',
      );
      expect(response.status).toBe(401);
    });

    it('returns 404 updating a house from a different school', async () => {
      const { auth } = await signUpAdmin();
      const { auth: otherAuth } = await signUpAdmin();
      const createResponse = await request(app.getHttpServer())
        .post('/school-admin/houses')
        .set(auth)
        .send({ name: 'Griffindor', shortName: 'GRF' });
      const house = body<{ id: string }>(createResponse);

      const response = await request(app.getHttpServer())
        .patch(`/school-admin/houses/${house.id}`)
        .set(otherAuth)
        .send({ name: 'Hijacked' });

      expect(response.status).toBe(404);
    });

    it('rejects a payload missing a required field with 400', async () => {
      const { auth } = await signUpAdmin();

      const response = await request(app.getHttpServer())
        .post('/school-admin/houses')
        .set(auth)
        .send({ name: 'Griffindor' });

      expect(response.status).toBe(400);
    });
  });

  describe('Spaces', () => {
    it('creates and updates equipment flags', async () => {
      const { auth } = await signUpAdmin();

      const createResponse = await request(app.getHttpServer())
        .post('/school-admin/spaces')
        .set(auth)
        .send({ name: 'Lab 1', hasComputer: true, computerStudentCount: 24 });
      expect(createResponse.status).toBe(201);
      expect(body<{ hasComputer: boolean }>(createResponse).hasComputer).toBe(
        true,
      );
    });
  });

  describe('Departments', () => {
    it('lets a Teacher view but not manage', async () => {
      const { school, auth } = await signUpAdmin();
      const teacherAuth = await addTeacherLogin(school.id);
      await request(app.getHttpServer())
        .post('/school-admin/departments')
        .set(auth)
        .send({ type: 'LearningArea', name: 'Mathematics', shortName: 'MATH' });

      const viewResponse = await request(app.getHttpServer())
        .get('/school-admin/departments')
        .set(teacherAuth);
      expect(viewResponse.status).toBe(200);

      const manageResponse = await request(app.getHttpServer())
        .post('/school-admin/departments')
        .set(teacherAuth)
        .send({ type: 'LearningArea', name: 'Science', shortName: 'SCI' });
      expect(manageResponse.status).toBe(403);
    });
  });

  describe('Settings', () => {
    it('rejects a duplicate (scope, name) with 409', async () => {
      const { auth } = await signUpAdmin();
      const dto = {
        scope: 'System',
        name: 'customSetting',
        nameDisplay: 'Custom Setting',
      };
      await request(app.getHttpServer())
        .post('/school-admin/settings')
        .set(auth)
        .send(dto);

      const response = await request(app.getHttpServer())
        .post('/school-admin/settings')
        .set(auth)
        .send(dto);

      expect(response.status).toBe(409);
    });

    it('already has the two Foundation defaults seeded at signup', async () => {
      const { auth } = await signUpAdmin();

      const response = await request(app.getHttpServer())
        .get('/school-admin/settings')
        .set(auth);

      expect(
        body<{ name: string }[]>(response)
          .map((s) => s.name)
          .sort(),
      ).toEqual(['organisationEmail', 'organisationName']);
    });
  });

  describe('Year groups', () => {
    it('rejects a headOfYearPersonId that does not belong to this school with 400', async () => {
      const { auth } = await signUpAdmin();

      const response = await request(app.getHttpServer())
        .post('/school-admin/year-groups')
        .set(auth)
        .send({
          name: 'Year 7',
          shortName: 'Y7',
          sequenceNumber: 7,
          headOfYearPersonId: randomUUID(),
        });

      expect(response.status).toBe(400);
    });

    it('creates a year group', async () => {
      const { auth } = await signUpAdmin();

      const response = await request(app.getHttpServer())
        .post('/school-admin/year-groups')
        .set(auth)
        .send({ name: 'Year 7', shortName: 'Y7', sequenceNumber: 7 });

      expect(response.status).toBe(201);
    });
  });

  describe('Form groups', () => {
    it('creates a form group under the school year created at signup, and manages staff', async () => {
      const { school, auth } = await signUpAdmin();
      const [year] = await schoolYears.findBySchool(school.id);

      const createResponse = await request(app.getHttpServer())
        .post('/school-admin/form-groups')
        .set(auth)
        .send({ schoolYearId: year.id, name: '7A', shortName: '7A' });
      expect(createResponse.status).toBe(201);
      const formGroup = body<{ id: string }>(createResponse);

      const listResponse = await request(app.getHttpServer())
        .get(`/school-admin/form-groups?schoolYearId=${year.id}`)
        .set(auth);
      expect(listResponse.status).toBe(200);
      expect(body<{ id: string }[]>(listResponse)).toHaveLength(1);

      const adminPerson = await people.findOne({
        where: { schoolId: school.id },
      });

      const addStaffResponse = await request(app.getHttpServer())
        .post(`/school-admin/form-groups/${formGroup.id}/staff`)
        .set(auth)
        .send({ personId: adminPerson!.id, role: 'Tutor' });
      expect(addStaffResponse.status).toBe(201);

      const staffListResponse = await request(app.getHttpServer())
        .get(`/school-admin/form-groups/${formGroup.id}/staff`)
        .set(auth);
      expect(staffListResponse.status).toBe(200);
      expect(body<{ role: string }[]>(staffListResponse)).toHaveLength(1);
    });

    it('rejects a schoolYearId from a different school with 400', async () => {
      const { auth } = await signUpAdmin();
      const { school: otherSchool } = await signUpAdmin();
      const [otherYear] = await schoolYears.findBySchool(otherSchool.id);

      const response = await request(app.getHttpServer())
        .post('/school-admin/form-groups')
        .set(auth)
        .send({ schoolYearId: otherYear.id, name: '7A', shortName: '7A' });

      expect(response.status).toBe(400);
    });
  });
});
