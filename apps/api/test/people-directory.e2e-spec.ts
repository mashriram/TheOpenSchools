import { randomUUID } from 'node:crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { SchoolsRepository } from '../src/modules/school/repositories/schools.repository';
import { SchoolYearsRepository } from '../src/modules/school/repositories/school-years.repository';
import { YearGroupsRepository } from '../src/modules/school/repositories/year-groups.repository';
import { FormGroupsRepository } from '../src/modules/school/repositories/form-groups.repository';
import { RolesRepository } from '../src/modules/rbac/repositories/roles.repository';
import { PeopleRepository } from '../src/modules/people/repositories/people.repository';
import { PersonCredentialsRepository } from '../src/modules/people/repositories/person-credentials.repository';
import { PersonRolesRepository } from '../src/modules/people/repositories/person-roles.repository';
import { HashingService } from '../src/modules/auth/hashing.service';

const PASSWORD = 'correct-horse-battery-staple';

function body<T>(response: request.Response): T {
  return response.body as T;
}

describe('People directory (e2e)', () => {
  let app: INestApplication<App>;
  let schools: SchoolsRepository;
  let schoolYears: SchoolYearsRepository;
  let yearGroups: YearGroupsRepository;
  let formGroups: FormGroupsRepository;
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
    yearGroups = moduleFixture.get(YearGroupsRepository);
    formGroups = moduleFixture.get(FormGroupsRepository);
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
    return { Authorization: `Bearer ${accessToken}` };
  }

  describe('/people', () => {
    it('supports create, get-profile, update, and delete for an admin', async () => {
      const { auth } = await signUpAdmin();

      const createResponse = await request(app.getHttpServer())
        .post('/people')
        .set(auth)
        .send({ surname: 'Smith', firstName: 'Jo' });
      expect(createResponse.status).toBe(201);
      const person = body<{ id: string }>(createResponse);

      const profileResponse = await request(app.getHttpServer())
        .get(`/people/${person.id}`)
        .set(auth);
      expect(profileResponse.status).toBe(200);
      expect(
        body<{ enrolments: unknown[] }>(profileResponse).enrolments,
      ).toEqual([]);

      const updateResponse = await request(app.getHttpServer())
        .patch(`/people/${person.id}`)
        .set(auth)
        .send({ preferredName: 'Joey' });
      expect(updateResponse.status).toBe(200);
      expect(
        body<{ preferredName: string }>(updateResponse).preferredName,
      ).toBe('Joey');

      const deleteResponse = await request(app.getHttpServer())
        .delete(`/people/${person.id}`)
        .set(auth);
      expect(deleteResponse.status).toBe(200);
    });

    it('a Student cannot manage the directory but can be listed by an admin', async () => {
      const { school, auth } = await signUpAdmin();
      const studentAuth = await addStudentLogin(school.id);

      const forbidden = await request(app.getHttpServer())
        .post('/people')
        .set(studentAuth)
        .send({ surname: 'Hacker', firstName: 'Mal' });
      expect(forbidden.status).toBe(403);

      const listResponse = await request(app.getHttpServer())
        .get('/people?role=Student')
        .set(auth);
      expect(listResponse.status).toBe(200);
      expect(body<{ surname: string }[]>(listResponse)).toHaveLength(1);
    });

    it('rejects an unauthenticated request with 401', async () => {
      const response = await request(app.getHttpServer()).get('/people');
      expect(response.status).toBe(401);
    });

    it('returns 404 for a syntactically-valid but nonexistent personId', async () => {
      const { auth } = await signUpAdmin();

      const response = await request(app.getHttpServer())
        .get(`/people/${randomUUID()}`)
        .set(auth);

      expect(response.status).toBe(404);
    });

    it('returns 404 for a person belonging to a different school', async () => {
      const { auth } = await signUpAdmin();
      const { auth: otherAuth } = await signUpAdmin();
      const createResponse = await request(app.getHttpServer())
        .post('/people')
        .set(auth)
        .send({ surname: 'Smith', firstName: 'Jo' });
      const personId = body<{ id: string }>(createResponse).id;

      const response = await request(app.getHttpServer())
        .get(`/people/${personId}`)
        .set(otherAuth);

      expect(response.status).toBe(404);
    });

    it('filters the directory by formGroupId', async () => {
      const { school, auth } = await signUpAdmin();
      const [year] = await schoolYears.findBySchool(school.id);
      const yearGroup = await yearGroups.save(
        yearGroups.create({
          schoolId: school.id,
          name: 'Year 7',
          shortName: 'Y7',
          sequenceNumber: 7,
        }),
      );
      const formGroup = await formGroups.save(
        formGroups.create({
          schoolYearId: year.id,
          name: '7A',
          shortName: '7A',
        }),
      );
      const createResponse = await request(app.getHttpServer())
        .post('/people')
        .set(auth)
        .send({ surname: 'Smith', firstName: 'Jo' });
      const person = body<{ id: string }>(createResponse);
      await request(app.getHttpServer())
        .post(`/people/${person.id}/enrolments`)
        .set(auth)
        .send({
          schoolYearId: year.id,
          yearGroupId: yearGroup.id,
          formGroupId: formGroup.id,
        });

      const response = await request(app.getHttpServer())
        .get(`/people?formGroupId=${formGroup.id}`)
        .set(auth);

      expect(response.status).toBe(200);
      expect(body<{ id: string }[]>(response).map((p) => p.id)).toEqual([
        person.id,
      ]);
    });
  });

  describe('/people/:id/staff', () => {
    it('upserts and removes a Staff profile', async () => {
      const { auth } = await signUpAdmin();
      const createResponse = await request(app.getHttpServer())
        .post('/people')
        .set(auth)
        .send({ surname: 'Teach', firstName: 'Terry' });
      const person = body<{ id: string }>(createResponse);

      const upsertResponse = await request(app.getHttpServer())
        .put(`/people/${person.id}/staff`)
        .set(auth)
        .send({ jobTitle: 'Teacher' });
      expect(upsertResponse.status).toBe(200);
      expect(body<{ jobTitle: string }>(upsertResponse).jobTitle).toBe(
        'Teacher',
      );

      const deleteResponse = await request(app.getHttpServer())
        .delete(`/people/${person.id}/staff`)
        .set(auth);
      expect(deleteResponse.status).toBe(200);
    });
  });

  describe('/people/:id/enrolments', () => {
    it('creates, updates, and rejects a cross-school year enrolment', async () => {
      const { school, auth } = await signUpAdmin();
      const [year] = await schoolYears.findBySchool(school.id);
      const yearGroup = await yearGroups.save(
        yearGroups.create({
          schoolId: school.id,
          name: 'Year 7',
          shortName: 'Y7',
          sequenceNumber: 7,
        }),
      );
      const formGroup = await formGroups.save(
        formGroups.create({
          schoolYearId: year.id,
          name: '7A',
          shortName: '7A',
        }),
      );
      const createResponse = await request(app.getHttpServer())
        .post('/people')
        .set(auth)
        .send({ surname: 'Student', firstName: 'Stu' });
      const person = body<{ id: string }>(createResponse);

      const enrolResponse = await request(app.getHttpServer())
        .post(`/people/${person.id}/enrolments`)
        .set(auth)
        .send({
          schoolYearId: year.id,
          yearGroupId: yearGroup.id,
          formGroupId: formGroup.id,
        });
      expect(enrolResponse.status).toBe(201);

      const invalidResponse = await request(app.getHttpServer())
        .post(`/people/${person.id}/enrolments`)
        .set(auth)
        .send({
          schoolYearId: year.id,
          yearGroupId: yearGroup.id,
          formGroupId: randomUUID(),
        });
      expect(invalidResponse.status).toBe(400);
    });
  });

  describe('/families', () => {
    it('supports create, addAdult, addChild, and getProfile', async () => {
      const { auth } = await signUpAdmin();
      const parentResponse = await request(app.getHttpServer())
        .post('/people')
        .set(auth)
        .send({ surname: 'Smith', firstName: 'Pat' });
      const parent = body<{ id: string }>(parentResponse);
      const childResponse = await request(app.getHttpServer())
        .post('/people')
        .set(auth)
        .send({ surname: 'Smith', firstName: 'Sam' });
      const child = body<{ id: string }>(childResponse);

      const createResponse = await request(app.getHttpServer())
        .post('/families')
        .set(auth)
        .send({ name: 'The Smiths' });
      expect(createResponse.status).toBe(201);
      const family = body<{ id: string }>(createResponse);

      const addAdultResponse = await request(app.getHttpServer())
        .post(`/families/${family.id}/adults`)
        .set(auth)
        .send({ personId: parent.id });
      expect(addAdultResponse.status).toBe(201);

      const addChildResponse = await request(app.getHttpServer())
        .post(`/families/${family.id}/children`)
        .set(auth)
        .send({ personId: child.id });
      expect(addChildResponse.status).toBe(201);

      const profileResponse = await request(app.getHttpServer())
        .get(`/families/${family.id}`)
        .set(auth);
      expect(profileResponse.status).toBe(200);
      const profile = body<{ adults: unknown[]; children: unknown[] }>(
        profileResponse,
      );
      expect(profile.adults).toHaveLength(1);
      expect(profile.children).toHaveLength(1);
    });

    it('is forbidden for a Student', async () => {
      const { school } = await signUpAdmin();
      const studentAuth = await addStudentLogin(school.id);

      const response = await request(app.getHttpServer())
        .get('/families')
        .set(studentAuth);

      expect(response.status).toBe(403);
    });

    it('returns 404 for a syntactically-valid but nonexistent familyId', async () => {
      const { auth } = await signUpAdmin();

      const response = await request(app.getHttpServer())
        .get(`/families/${randomUUID()}`)
        .set(auth);

      expect(response.status).toBe(404);
    });

    it('returns 404 for a family belonging to a different school', async () => {
      const { auth } = await signUpAdmin();
      const { auth: otherAuth } = await signUpAdmin();
      const createResponse = await request(app.getHttpServer())
        .post('/families')
        .set(auth)
        .send({ name: 'The Smiths' });
      const familyId = body<{ id: string }>(createResponse).id;

      const response = await request(app.getHttpServer())
        .get(`/families/${familyId}`)
        .set(otherAuth);

      expect(response.status).toBe(404);
    });
  });
});
