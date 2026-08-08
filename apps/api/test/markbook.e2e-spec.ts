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

describe('Markbook (e2e)', () => {
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
    const accessToken = body<{ accessToken: string; person: { id: string } }>(
      response,
    ).accessToken;
    return {
      school: school!,
      accessToken,
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

  async function setUpCourseClass(
    auth: Record<string, string>,
    schoolId: string,
  ) {
    const [year] = await schoolYears.findBySchool(schoolId);
    const courseResponse = await request(app.getHttpServer())
      .post('/curriculum/courses')
      .set(auth)
      .send({ schoolYearId: year.id, name: 'Maths', shortName: 'MATH' });
    const course = body<{ id: string }>(courseResponse);
    const classResponse = await request(app.getHttpServer())
      .post(`/curriculum/courses/${course.id}/classes`)
      .set(auth)
      .send({ name: 'Maths 7A', shortName: 'M7A' });
    return body<{ id: string }>(classResponse);
  }

  /** Grades F=1, D=2 (lowestAcceptable), A=5. */
  async function setUpScale(auth: Record<string, string>) {
    const scaleResponse = await request(app.getHttpServer())
      .post('/markbook/scales')
      .set(auth)
      .send({ name: 'Attainment Scale', shortName: 'ATT' });
    const scale = body<{ id: string }>(scaleResponse);
    const gradeFResponse = await request(app.getHttpServer())
      .post(`/markbook/scales/${scale.id}/grades`)
      .set(auth)
      .send({ name: 'F', shortName: 'F', value: 1 });
    await request(app.getHttpServer())
      .post(`/markbook/scales/${scale.id}/grades`)
      .set(auth)
      .send({ name: 'D', shortName: 'D', value: 2, lowestAcceptable: true });
    const gradeAResponse = await request(app.getHttpServer())
      .post(`/markbook/scales/${scale.id}/grades`)
      .set(auth)
      .send({ name: 'A', shortName: 'A', value: 5 });
    return {
      scale,
      gradeF: body<{ id: string }>(gradeFResponse),
      gradeA: body<{ id: string }>(gradeAResponse),
    };
  }

  describe('Grading scales', () => {
    it('supports the full CRUD lifecycle for an admin, including grades', async () => {
      const { auth } = await signUpAdmin();

      const { scale, gradeF } = await setUpScale(auth);

      const listResponse = await request(app.getHttpServer())
        .get(`/markbook/scales/${scale.id}/grades`)
        .set(auth);
      expect(listResponse.status).toBe(200);
      expect(body<unknown[]>(listResponse)).toHaveLength(3);

      const deleteGradeResponse = await request(app.getHttpServer())
        .delete(`/markbook/grades/${gradeF.id}`)
        .set(auth);
      expect(deleteGradeResponse.status).toBe(200);

      const deleteScaleResponse = await request(app.getHttpServer())
        .delete(`/markbook/scales/${scale.id}`)
        .set(auth);
      expect(deleteScaleResponse.status).toBe(200);
    });

    it('is forbidden for an actor with no grants at all', async () => {
      const { school } = await signUpAdmin();
      const noGrantsAuth = await addNoGrantsLogin(school.id);

      const response = await request(app.getHttpServer())
        .get('/markbook/scales')
        .set(noGrantsAuth);

      expect(response.status).toBe(403);
    });

    it('rejects an unauthenticated request with 401', async () => {
      const response = await request(app.getHttpServer()).get(
        '/markbook/scales',
      );
      expect(response.status).toBe(401);
    });
  });

  describe('Markbook columns', () => {
    it('creates a column scoped to a course class and rejects bad input with 400', async () => {
      const { auth, school } = await signUpAdmin();
      const courseClass = await setUpCourseClass(auth, school.id);

      const createResponse = await request(app.getHttpServer())
        .post(`/curriculum/classes/${courseClass.id}/markbook/columns`)
        .set(auth)
        .send({ name: 'Term 1 Test' });
      expect(createResponse.status).toBe(201);

      const badResponse = await request(app.getHttpServer())
        .post(`/curriculum/classes/${courseClass.id}/markbook/columns`)
        .set(auth)
        .send({ name: 'Term 1 Test', viewableStudents: 'not-a-boolean' });
      expect(badResponse.status).toBe(400);
    });

    it('returns 404 for a column belonging to a different school', async () => {
      const { auth, school } = await signUpAdmin();
      const courseClass = await setUpCourseClass(auth, school.id);
      const columnResponse = await request(app.getHttpServer())
        .post(`/curriculum/classes/${courseClass.id}/markbook/columns`)
        .set(auth)
        .send({ name: 'Term 1 Test' });
      const column = body<{ id: string }>(columnResponse);
      const { auth: otherAuth } = await signUpAdmin();

      const response = await request(app.getHttpServer())
        .patch(`/markbook/columns/${column.id}`)
        .set(otherAuth)
        .send({ name: 'Hijacked' });

      expect(response.status).toBe(404);
    });
  });

  describe('Grade entry and the column-visibility gate', () => {
    it('computes a concern flag, and hides/shows the entry per the visibility gate', async () => {
      const { auth, school } = await signUpAdmin();
      const courseClass = await setUpCourseClass(auth, school.id);
      const { scale, gradeF } = await setUpScale(auth);
      const columnResponse = await request(app.getHttpServer())
        .post(`/curriculum/classes/${courseClass.id}/markbook/columns`)
        .set(auth)
        .send({ name: 'Term 1 Test', scaleIdAttainment: scale.id });
      const column = body<{ id: string }>(columnResponse);
      const { personId: studentId, auth: studentAuth } = await addPersonLogin(
        school.id,
        'Student',
        'Student',
      );
      await request(app.getHttpServer())
        .post(`/curriculum/classes/${courseClass.id}/enrolments`)
        .set(auth)
        .send({ personId: studentId, role: 'Student' });

      const enterGradeResponse = await request(app.getHttpServer())
        .post(`/markbook/columns/${column.id}/entries`)
        .set(auth)
        .send({ personId: studentId, attainmentScaleGradeId: gradeF.id });
      expect(enterGradeResponse.status).toBe(201);
      expect(
        body<{ attainmentConcern: string }>(enterGradeResponse)
          .attainmentConcern,
      ).toBe('Y');

      // Column not yet published: the student cannot see their own entry.
      const hiddenResponse = await request(app.getHttpServer())
        .get(`/markbook/columns/${column.id}/entries/${studentId}`)
        .set(studentAuth);
      expect(hiddenResponse.status).toBe(404);

      // Teacher/admin can always see it regardless of publication state.
      const teacherViewResponse = await request(app.getHttpServer())
        .get(`/markbook/columns/${column.id}/entries/${studentId}`)
        .set(auth);
      expect(teacherViewResponse.status).toBe(200);

      // Publish the column: the student can now see their entry.
      await request(app.getHttpServer())
        .patch(`/markbook/columns/${column.id}`)
        .set(auth)
        .send({
          complete: true,
          viewableStudents: true,
          completeDate: '2020-01-01',
        });

      const visibleResponse = await request(app.getHttpServer())
        .get(`/markbook/columns/${column.id}/entries/${studentId}`)
        .set(studentAuth);
      expect(visibleResponse.status).toBe(200);
      expect(
        body<{ attainmentScaleGradeId: string }>(visibleResponse)
          .attainmentScaleGradeId,
      ).toBe(gradeF.id);
    });

    it('forbids a student from reading another student’s entry via a swapped personId', async () => {
      const { auth, school } = await signUpAdmin();
      const courseClass = await setUpCourseClass(auth, school.id);
      const { scale, gradeF } = await setUpScale(auth);
      const columnResponse = await request(app.getHttpServer())
        .post(`/curriculum/classes/${courseClass.id}/markbook/columns`)
        .set(auth)
        .send({
          name: 'Term 1 Test',
          scaleIdAttainment: scale.id,
          complete: true,
          viewableStudents: true,
        });
      const column = body<{ id: string }>(columnResponse);
      const { personId: studentId } = await addPersonLogin(
        school.id,
        'Student',
        'Student',
      );
      await request(app.getHttpServer())
        .post(`/curriculum/classes/${courseClass.id}/enrolments`)
        .set(auth)
        .send({ personId: studentId, role: 'Student' });
      await request(app.getHttpServer())
        .post(`/markbook/columns/${column.id}/entries`)
        .set(auth)
        .send({ personId: studentId, attainmentScaleGradeId: gradeF.id });
      const { auth: otherStudentAuth } = await addPersonLogin(
        school.id,
        'Student',
        'Other',
      );

      const response = await request(app.getHttpServer())
        .get(`/markbook/columns/${column.id}/entries/${studentId}`)
        .set(otherStudentAuth);

      expect(response.status).toBe(404);
    });
  });

  describe('Personal targets and weightings', () => {
    it('supports the full CRUD lifecycle for targets and weightings', async () => {
      const { auth, school } = await signUpAdmin();
      const courseClass = await setUpCourseClass(auth, school.id);
      const { gradeA } = await setUpScale(auth);
      const { personId: studentId } = await addPersonLogin(
        school.id,
        'Student',
        'Student',
      );
      await request(app.getHttpServer())
        .post(`/curriculum/classes/${courseClass.id}/enrolments`)
        .set(auth)
        .send({ personId: studentId, role: 'Student' });

      const targetResponse = await request(app.getHttpServer())
        .post(`/curriculum/classes/${courseClass.id}/markbook/targets`)
        .set(auth)
        .send({ personId: studentId, targetScaleGradeId: gradeA.id });
      expect(targetResponse.status).toBe(201);

      const weightResponse = await request(app.getHttpServer())
        .post(`/curriculum/classes/${courseClass.id}/markbook/weights`)
        .set(auth)
        .send({ name: 'Exams', weighting: 60 });
      expect(weightResponse.status).toBe(201);

      const listWeightsResponse = await request(app.getHttpServer())
        .get(`/curriculum/classes/${courseClass.id}/markbook/weights`)
        .set(auth);
      expect(body<unknown[]>(listWeightsResponse)).toHaveLength(1);
    });
  });
});
