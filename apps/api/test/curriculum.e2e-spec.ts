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

describe('Curriculum (e2e)', () => {
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

  /** Adds a Teacher-only login to an existing school. */
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

  /**
   * Curriculum's RBAC catalog grants Teacher `manage` on Course/CourseClass/
   * CourseClassPerson/Unit, so addTeacherLogin's actor is not actually
   * forbidden here (unlike school-admin.e2e-spec.ts's Houses/Spaces). A
   * genuinely-forbidden actor needs a role with zero grants at all, seeded
   * the same way rbac.e2e-spec.ts builds one.
   */
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

  describe('Courses', () => {
    it('supports the full CRUD lifecycle for an admin', async () => {
      const { school, auth } = await signUpAdmin();
      const [year] = await schoolYears.findBySchool(school.id);

      const createResponse = await request(app.getHttpServer())
        .post('/curriculum/courses')
        .set(auth)
        .send({
          schoolYearId: year.id,
          name: 'Mathematics',
          shortName: 'MATH',
        });
      expect(createResponse.status).toBe(201);
      const course = body<{ id: string; name: string }>(createResponse);
      expect(course.name).toBe('Mathematics');

      const listResponse = await request(app.getHttpServer())
        .get(`/curriculum/courses?schoolYearId=${year.id}`)
        .set(auth);
      expect(listResponse.status).toBe(200);
      expect(body<{ id: string }[]>(listResponse)).toHaveLength(1);

      const updateResponse = await request(app.getHttpServer())
        .patch(`/curriculum/courses/${course.id}`)
        .set(auth)
        .send({ name: 'Mathematics (Core)' });
      expect(updateResponse.status).toBe(200);
      expect(body<{ name: string }>(updateResponse).name).toBe(
        'Mathematics (Core)',
      );

      const deleteResponse = await request(app.getHttpServer())
        .delete(`/curriculum/courses/${course.id}`)
        .set(auth);
      expect(deleteResponse.status).toBe(200);

      const afterDeleteResponse = await request(app.getHttpServer())
        .get(`/curriculum/courses?schoolYearId=${year.id}`)
        .set(auth);
      expect(body<{ id: string }[]>(afterDeleteResponse)).toHaveLength(0);
    });

    it('succeeds for a Teacher, who is granted manage by the curriculum catalog', async () => {
      const { school } = await signUpAdmin();
      const [year] = await schoolYears.findBySchool(school.id);
      const teacherAuth = await addTeacherLogin(school.id);

      const response = await request(app.getHttpServer())
        .post('/curriculum/courses')
        .set(teacherAuth)
        .send({ schoolYearId: year.id, name: 'Science', shortName: 'SCI' });

      expect(response.status).toBe(201);
    });

    it('is forbidden for an actor with no grants at all', async () => {
      const { school } = await signUpAdmin();
      const noGrantsAuth = await addNoGrantsLogin(school.id);

      const response = await request(app.getHttpServer())
        .get('/curriculum/courses')
        .set(noGrantsAuth);

      expect(response.status).toBe(403);
    });

    it('rejects an unauthenticated request with 401', async () => {
      const response = await request(app.getHttpServer()).get(
        '/curriculum/courses',
      );
      expect(response.status).toBe(401);
    });

    it('returns 404 updating a course from a different school', async () => {
      const { school, auth } = await signUpAdmin();
      const [year] = await schoolYears.findBySchool(school.id);
      const { auth: otherAuth } = await signUpAdmin();
      const createResponse = await request(app.getHttpServer())
        .post('/curriculum/courses')
        .set(auth)
        .send({
          schoolYearId: year.id,
          name: 'Mathematics',
          shortName: 'MATH',
        });
      const course = body<{ id: string }>(createResponse);

      const response = await request(app.getHttpServer())
        .patch(`/curriculum/courses/${course.id}`)
        .set(otherAuth)
        .send({ name: 'Hijacked' });

      expect(response.status).toBe(404);
    });

    it('rejects a payload missing a required field with 400', async () => {
      const { school, auth } = await signUpAdmin();
      const [year] = await schoolYears.findBySchool(school.id);

      const response = await request(app.getHttpServer())
        .post('/curriculum/courses')
        .set(auth)
        .send({ schoolYearId: year.id, name: 'Mathematics' });

      expect(response.status).toBe(400);
    });

    it('rejects a schoolYearId from a different school with 400', async () => {
      const { auth } = await signUpAdmin();
      const { school: otherSchool } = await signUpAdmin();
      const [otherYear] = await schoolYears.findBySchool(otherSchool.id);

      const response = await request(app.getHttpServer())
        .post('/curriculum/courses')
        .set(auth)
        .send({
          schoolYearId: otherYear.id,
          name: 'Mathematics',
          shortName: 'MATH',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('Course classes', () => {
    it('creates and lists a class under a course', async () => {
      const { school, auth } = await signUpAdmin();
      const [year] = await schoolYears.findBySchool(school.id);
      const createCourseResponse = await request(app.getHttpServer())
        .post('/curriculum/courses')
        .set(auth)
        .send({
          schoolYearId: year.id,
          name: 'Mathematics',
          shortName: 'MATH',
        });
      const course = body<{ id: string }>(createCourseResponse);

      const createClassResponse = await request(app.getHttpServer())
        .post(`/curriculum/courses/${course.id}/classes`)
        .set(auth)
        .send({ name: 'Mathematics 7A', shortName: '7A' });
      expect(createClassResponse.status).toBe(201);
      const courseClass = body<{ id: string }>(createClassResponse);

      const listResponse = await request(app.getHttpServer())
        .get(`/curriculum/courses/${course.id}/classes`)
        .set(auth);
      expect(listResponse.status).toBe(200);
      expect(body<{ id: string }[]>(listResponse)).toHaveLength(1);

      const updateResponse = await request(app.getHttpServer())
        .patch(`/curriculum/classes/${courseClass.id}`)
        .set(auth)
        .send({ takesAttendance: false });
      expect(updateResponse.status).toBe(200);
      expect(
        body<{ takesAttendance: boolean }>(updateResponse).takesAttendance,
      ).toBe(false);

      const deleteResponse = await request(app.getHttpServer())
        .delete(`/curriculum/classes/${courseClass.id}`)
        .set(auth);
      expect(deleteResponse.status).toBe(200);
    });
  });

  describe('Enrolment', () => {
    async function createCourseClass(
      auth: Record<string, string>,
      year: {
        id: string;
      },
    ) {
      const createCourseResponse = await request(app.getHttpServer())
        .post('/curriculum/courses')
        .set(auth)
        .send({
          schoolYearId: year.id,
          name: 'Mathematics',
          shortName: 'MATH',
        });
      const course = body<{ id: string }>(createCourseResponse);

      const createClassResponse = await request(app.getHttpServer())
        .post(`/curriculum/courses/${course.id}/classes`)
        .set(auth)
        .send({ name: 'Mathematics 7A', shortName: '7A' });
      return body<{ id: string }>(createClassResponse);
    }

    it('enrols and unenrols a person, setting dateEnrolled/dateUnenrolled', async () => {
      const { school, auth } = await signUpAdmin();
      const [year] = await schoolYears.findBySchool(school.id);
      const courseClass = await createCourseClass(auth, year);
      const person = await people.save(
        people.create({
          schoolId: school.id,
          surname: 'Student',
          firstName: 'Sam',
          email: `${randomUUID()}@example.com`,
        }),
      );
      const today = new Date().toISOString().slice(0, 10);

      const enrolResponse = await request(app.getHttpServer())
        .post(`/curriculum/classes/${courseClass.id}/enrolments`)
        .set(auth)
        .send({ personId: person.id, role: 'Student' });
      expect(enrolResponse.status).toBe(201);
      const enrolment = body<{
        id: string;
        dateEnrolled: string;
        dateUnenrolled: string | null;
      }>(enrolResponse);
      expect(enrolment.dateEnrolled).toBe(today);
      expect(enrolment.dateUnenrolled).toBeNull();

      const listResponse = await request(app.getHttpServer())
        .get(`/curriculum/classes/${courseClass.id}/enrolments`)
        .set(auth);
      expect(listResponse.status).toBe(200);
      expect(body<{ id: string }[]>(listResponse)).toHaveLength(1);

      const unenrolResponse = await request(app.getHttpServer())
        .post(
          `/curriculum/classes/${courseClass.id}/enrolments/${enrolment.id}/unenrol`,
        )
        .set(auth);
      expect(unenrolResponse.status).toBe(201);
      expect(
        body<{ dateUnenrolled: string }>(unenrolResponse).dateUnenrolled,
      ).toBe(today);
    });

    it('returns 404 enrolling a person from a different school', async () => {
      const { school, auth } = await signUpAdmin();
      const [year] = await schoolYears.findBySchool(school.id);
      const courseClass = await createCourseClass(auth, year);
      const { school: otherSchool } = await signUpAdmin();
      const otherPerson = await people.save(
        people.create({
          schoolId: otherSchool.id,
          surname: 'Outsider',
          firstName: 'Oz',
          email: `${randomUUID()}@example.com`,
        }),
      );

      const response = await request(app.getHttpServer())
        .post(`/curriculum/classes/${courseClass.id}/enrolments`)
        .set(auth)
        .send({ personId: otherPerson.id, role: 'Student' });

      expect(response.status).toBe(404);
    });

    it('rejects an invalid role with 400', async () => {
      const { school, auth } = await signUpAdmin();
      const [year] = await schoolYears.findBySchool(school.id);
      const courseClass = await createCourseClass(auth, year);
      const person = await people.save(
        people.create({
          schoolId: school.id,
          surname: 'Student',
          firstName: 'Sam',
          email: `${randomUUID()}@example.com`,
        }),
      );

      const response = await request(app.getHttpServer())
        .post(`/curriculum/classes/${courseClass.id}/enrolments`)
        .set(auth)
        .send({ personId: person.id, role: 'Student - Left' });

      expect(response.status).toBe(400);
    });
  });
});
