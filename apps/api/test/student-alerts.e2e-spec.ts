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

describe('Student Alerts (e2e)', () => {
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

  async function setUpTypes(auth: Record<string, string>) {
    const medicalResponse = await request(app.getHttpServer())
      .post('/student-alerts/types')
      .set(auth)
      .send({ name: 'Medical', adminOnly: true });
    const academicResponse = await request(app.getHttpServer())
      .post('/student-alerts/types')
      .set(auth)
      .send({ name: 'Academic', adminOnly: false });
    return {
      medicalType: body<{ id: string }>(medicalResponse),
      academicType: body<{ id: string }>(academicResponse),
    };
  }

  describe('Real Gibbon bug #1: adminOnly must gate viewing, not just the creation dropdown', () => {
    it('never returns an admin-only alert to a default Teacher login, not even in a list', async () => {
      const { auth, school } = await signUpAdmin();
      const [year] = await schoolYears.findBySchool(school.id);
      const { medicalType, academicType } = await setUpTypes(auth);
      const { personId: studentId } = await addPersonLogin(
        school.id,
        'Student',
        'Student',
      );
      const medicalAlertResponse = await request(app.getHttpServer())
        .post('/student-alerts')
        .set(auth)
        .send({
          schoolYearId: year.id,
          personId: studentId,
          alertTypeId: medicalType.id,
          comment: 'Confidential medical detail',
        });
      expect(medicalAlertResponse.status).toBe(201);
      const medicalAlert = body<{ id: string }>(medicalAlertResponse);
      await request(app.getHttpServer())
        .post('/student-alerts')
        .set(auth)
        .send({
          schoolYearId: year.id,
          personId: studentId,
          alertTypeId: academicType.id,
        });
      const { auth: teacherAuth } = await addPersonLogin(
        school.id,
        'Teacher',
        'Teacher',
      );

      const listResponse = await request(app.getHttpServer())
        .get(`/student-alerts/people/${studentId}`)
        .set(teacherAuth);
      expect(listResponse.status).toBe(200);
      const list = body<{ alertTypeId: string }[]>(listResponse);
      expect(list).toHaveLength(1);
      expect(list[0].alertTypeId).toBe(academicType.id);

      const directFetchResponse = await request(app.getHttpServer())
        .get(`/student-alerts/${medicalAlert.id}`)
        .set(teacherAuth);
      expect(directFetchResponse.status).toBe(404);
    });

    it('allows the Admin role to view the admin-only alert directly', async () => {
      const { auth, school } = await signUpAdmin();
      const [year] = await schoolYears.findBySchool(school.id);
      const { medicalType } = await setUpTypes(auth);
      const { personId: studentId } = await addPersonLogin(
        school.id,
        'Student',
        'Student',
      );
      const createResponse = await request(app.getHttpServer())
        .post('/student-alerts')
        .set(auth)
        .send({
          schoolYearId: year.id,
          personId: studentId,
          alertTypeId: medicalType.id,
        });
      const alert = body<{ id: string }>(createResponse);

      const response = await request(app.getHttpServer())
        .get(`/student-alerts/${alert.id}`)
        .set(auth);

      expect(response.status).toBe(200);
    });

    it('rejects a default Teacher login creating an admin-only-typed alert', async () => {
      const { auth, school } = await signUpAdmin();
      const [year] = await schoolYears.findBySchool(school.id);
      const { medicalType } = await setUpTypes(auth);
      const { personId: studentId } = await addPersonLogin(
        school.id,
        'Student',
        'Student',
      );
      const { auth: teacherAuth } = await addPersonLogin(
        school.id,
        'Teacher',
        'Teacher',
      );

      const response = await request(app.getHttpServer())
        .post('/student-alerts')
        .set(teacherAuth)
        .send({
          schoolYearId: year.id,
          personId: studentId,
          alertTypeId: medicalType.id,
        });

      expect(response.status).toBe(403);
    });
  });

  describe('Real Gibbon bug #2: no badge endpoint may ever embed raw comment content', () => {
    it('returns badges with no comment field, and excludes admin-only alerts for a Teacher login', async () => {
      const { auth, school } = await signUpAdmin();
      const [year] = await schoolYears.findBySchool(school.id);
      const { medicalType, academicType } = await setUpTypes(auth);
      const { personId: studentId } = await addPersonLogin(
        school.id,
        'Student',
        'Student',
      );
      await request(app.getHttpServer())
        .post('/student-alerts')
        .set(auth)
        .send({
          schoolYearId: year.id,
          personId: studentId,
          alertTypeId: academicType.id,
          comment: 'Highly confidential detail',
        });
      await request(app.getHttpServer())
        .post('/student-alerts')
        .set(auth)
        .send({
          schoolYearId: year.id,
          personId: studentId,
          alertTypeId: medicalType.id,
        });
      const { auth: teacherAuth } = await addPersonLogin(
        school.id,
        'Teacher',
        'Teacher',
      );

      const response = await request(app.getHttpServer())
        .get(`/student-alerts/people/${studentId}/badges`)
        .set(teacherAuth);

      expect(response.status).toBe(200);
      const badges = body<Record<string, unknown>[]>(response);
      expect(badges).toHaveLength(1);
      expect(badges[0]).not.toHaveProperty('comment');
      expect(JSON.stringify(response.body)).not.toContain(
        'Highly confidential detail',
      );
    });
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
      .get(`/student-alerts/people/${studentId}`)
      .set(noGrantsAuth);

    expect(response.status).toBe(403);
  });

  it('rejects an unauthenticated request with 401', async () => {
    const response = await request(app.getHttpServer()).get(
      `/student-alerts/people/${randomUUID()}`,
    );
    expect(response.status).toBe(401);
  });
});
