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

describe('Attendance (e2e)', () => {
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

  async function setUpFormGroupWithStudent(
    auth: Record<string, string>,
    schoolId: string,
  ) {
    const [year] = await schoolYears.findBySchool(schoolId);
    const yearGroupResponse = await request(app.getHttpServer())
      .post('/school-admin/year-groups')
      .set(auth)
      .send({ name: 'Year 7', shortName: 'Y7', sequenceNumber: 7 });
    const yearGroup = body<{ id: string }>(yearGroupResponse);
    const formGroupResponse = await request(app.getHttpServer())
      .post('/school-admin/form-groups')
      .set(auth)
      .send({ schoolYearId: year.id, name: '7A', shortName: '7A' });
    const formGroup = body<{ id: string }>(formGroupResponse);
    const { personId: studentId, auth: studentAuth } = await addPersonLogin(
      schoolId,
      'Student',
      'Student',
    );
    await request(app.getHttpServer())
      .post(`/people/${studentId}/enrolments`)
      .set(auth)
      .send({
        schoolYearId: year.id,
        yearGroupId: yearGroup.id,
        formGroupId: formGroup.id,
      });
    return { formGroup, studentId, studentAuth };
  }

  async function setUpPresentCode(auth: Record<string, string>) {
    const response = await request(app.getHttpServer())
      .post('/attendance/codes')
      .set(auth)
      .send({
        name: 'Present',
        shortName: 'P',
        direction: 'In',
        scope: 'Onsite',
      });
    return body<{ id: string }>(response);
  }

  describe('Attendance codes', () => {
    it('supports the full CRUD lifecycle for an admin', async () => {
      const { auth } = await signUpAdmin();

      const code = await setUpPresentCode(auth);

      const listResponse = await request(app.getHttpServer())
        .get('/attendance/codes')
        .set(auth);
      expect(listResponse.status).toBe(200);
      expect(body<unknown[]>(listResponse)).toHaveLength(1);

      const deleteResponse = await request(app.getHttpServer())
        .delete(`/attendance/codes/${code.id}`)
        .set(auth);
      expect(deleteResponse.status).toBe(200);
    });

    it('is forbidden for an actor with no grants at all', async () => {
      const { school } = await signUpAdmin();
      const noGrantsAuth = await addNoGrantsLogin(school.id);

      const response = await request(app.getHttpServer())
        .get('/attendance/codes')
        .set(noGrantsAuth);

      expect(response.status).toBe(403);
    });

    it('rejects an unauthenticated request with 401', async () => {
      const response = await request(app.getHttpServer()).get(
        '/attendance/codes',
      );
      expect(response.status).toBe(401);
    });
  });

  describe('Form group registers', () => {
    it('records attendance and rejects an unenrolled student with 400', async () => {
      const { auth, school } = await signUpAdmin();
      const { formGroup, studentId } = await setUpFormGroupWithStudent(
        auth,
        school.id,
      );
      const code = await setUpPresentCode(auth);

      const recordResponse = await request(app.getHttpServer())
        .post(`/attendance/form-groups/${formGroup.id}/registers`)
        .set(auth)
        .send({
          date: '2026-09-01',
          entries: [{ personId: studentId, attendanceCodeId: code.id }],
        });
      expect(recordResponse.status).toBe(201);
      expect(body<{ direction: string }[]>(recordResponse)[0].direction).toBe(
        'In',
      );

      const stranger = await addPersonLogin(school.id, 'Student', 'Other');
      const badResponse = await request(app.getHttpServer())
        .post(`/attendance/form-groups/${formGroup.id}/registers`)
        .set(auth)
        .send({
          date: '2026-09-01',
          entries: [{ personId: stranger.personId, attendanceCodeId: code.id }],
        });
      expect(badResponse.status).toBe(400);
    });

    it('lets a student view their own attendance, but not another student’s', async () => {
      const { auth, school } = await signUpAdmin();
      const { formGroup, studentId, studentAuth } =
        await setUpFormGroupWithStudent(auth, school.id);
      const code = await setUpPresentCode(auth);
      await request(app.getHttpServer())
        .post(`/attendance/form-groups/${formGroup.id}/registers`)
        .set(auth)
        .send({
          date: '2026-09-01',
          entries: [{ personId: studentId, attendanceCodeId: code.id }],
        });

      const ownHistoryResponse = await request(app.getHttpServer())
        .get(`/attendance/people/${studentId}`)
        .query({ dateStart: '2026-09-01', dateEnd: '2026-09-07' })
        .set(studentAuth);
      expect(ownHistoryResponse.status).toBe(200);
      expect(body<unknown[]>(ownHistoryResponse)).toHaveLength(1);

      const { auth: otherStudentAuth } = await addPersonLogin(
        school.id,
        'Student',
        'Other',
      );
      const forbiddenResponse = await request(app.getHttpServer())
        .get(`/attendance/people/${studentId}`)
        .query({ dateStart: '2026-09-01', dateEnd: '2026-09-07' })
        .set(otherStudentAuth);
      expect(forbiddenResponse.status).toBe(403);
    });
  });

  describe('Course class registers', () => {
    it('records attendance for an enrolled student in a class', async () => {
      const { auth, school } = await signUpAdmin();
      const [year] = await schoolYears.findBySchool(school.id);
      const courseResponse = await request(app.getHttpServer())
        .post('/curriculum/courses')
        .set(auth)
        .send({ schoolYearId: year.id, name: 'Maths', shortName: 'MATH' });
      const course = body<{ id: string }>(courseResponse);
      const classResponse = await request(app.getHttpServer())
        .post(`/curriculum/courses/${course.id}/classes`)
        .set(auth)
        .send({ name: 'Maths 7A', shortName: 'M7A' });
      const courseClass = body<{ id: string }>(classResponse);
      const { personId: studentId } = await addPersonLogin(
        school.id,
        'Student',
        'Student',
      );
      await request(app.getHttpServer())
        .post(`/curriculum/classes/${courseClass.id}/enrolments`)
        .set(auth)
        .send({ personId: studentId, role: 'Student' });
      const code = await setUpPresentCode(auth);

      const recordResponse = await request(app.getHttpServer())
        .post(`/curriculum/classes/${courseClass.id}/attendance/registers`)
        .set(auth)
        .send({
          date: '2026-09-01',
          entries: [{ personId: studentId, attendanceCodeId: code.id }],
        });

      expect(recordResponse.status).toBe(201);
    });
  });
});
