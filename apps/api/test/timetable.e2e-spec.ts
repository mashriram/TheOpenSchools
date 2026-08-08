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

describe('Timetable (e2e)', () => {
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
    const adminId = body<{ person: { id: string } }>(response).person.id;
    return {
      school: school!,
      accessToken,
      adminId,
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

  describe('Timetable Columns', () => {
    it('supports the full CRUD lifecycle for an admin, including rows', async () => {
      const { auth } = await signUpAdmin();

      const createResponse = await request(app.getHttpServer())
        .post('/timetable-admin/columns')
        .set(auth)
        .send({ name: 'Week A', shortName: 'WKA' });
      expect(createResponse.status).toBe(201);
      const column = body<{ id: string }>(createResponse);

      const rowResponse = await request(app.getHttpServer())
        .post(`/timetable-admin/columns/${column.id}/rows`)
        .set(auth)
        .send({
          name: 'Period 1',
          shortName: 'P1',
          timeStart: '09:00',
          timeEnd: '09:50',
          type: 'Lesson',
        });
      expect(rowResponse.status).toBe(201);

      const listResponse = await request(app.getHttpServer())
        .get('/timetable-admin/columns')
        .set(auth);
      expect(listResponse.status).toBe(200);
      expect(body<unknown[]>(listResponse)).toHaveLength(1);

      const deleteResponse = await request(app.getHttpServer())
        .delete(`/timetable-admin/columns/${column.id}`)
        .set(auth);
      expect(deleteResponse.status).toBe(200);
    });

    it('is forbidden for an actor with no grants at all', async () => {
      const { school } = await signUpAdmin();
      const noGrantsAuth = await addNoGrantsLogin(school.id);

      const response = await request(app.getHttpServer())
        .get('/timetable-admin/columns')
        .set(noGrantsAuth);

      expect(response.status).toBe(403);
    });

    it('rejects an unauthenticated request with 401', async () => {
      const response = await request(app.getHttpServer()).get(
        '/timetable-admin/columns',
      );
      expect(response.status).toBe(401);
    });

    it('rejects a payload missing a required field with 400', async () => {
      const { auth } = await signUpAdmin();

      const response = await request(app.getHttpServer())
        .post('/timetable-admin/columns')
        .set(auth)
        .send({ name: 'Week A' });

      expect(response.status).toBe(400);
    });
  });

  describe('Timetables and Days', () => {
    it('creates a timetable, a day, and maps a date to it', async () => {
      const { auth, school } = await signUpAdmin();
      const [year] = await schoolYears.findBySchool(school.id);
      const columnResponse = await request(app.getHttpServer())
        .post('/timetable-admin/columns')
        .set(auth)
        .send({ name: 'Week A', shortName: 'WKA' });
      const column = body<{ id: string }>(columnResponse);

      const timetableResponse = await request(app.getHttpServer())
        .post('/timetable-admin/timetables')
        .set(auth)
        .send({ schoolYearId: year.id, name: 'Timetable', shortName: 'TT' });
      expect(timetableResponse.status).toBe(201);
      const timetable = body<{ id: string }>(timetableResponse);

      const dayResponse = await request(app.getHttpServer())
        .post(`/timetable-admin/timetables/${timetable.id}/days`)
        .set(auth)
        .send({
          timetableColumnId: column.id,
          name: 'Mon A',
          shortName: 'MA',
          color: '#ff0000',
          fontColor: '#ffffff',
        });
      expect(dayResponse.status).toBe(201);
      const day = body<{ id: string }>(dayResponse);

      const mapResponse = await request(app.getHttpServer())
        .post(`/timetable-admin/days/${day.id}/dates`)
        .set(auth)
        .send({ date: '2026-09-03' });
      expect(mapResponse.status).toBe(201);
    });

    it('returns 404 fetching a timetable-scoped resource from a different school', async () => {
      const { auth, school } = await signUpAdmin();
      const { auth: otherAuth } = await signUpAdmin();
      const [year] = await schoolYears.findBySchool(school.id);
      const timetableResponse = await request(app.getHttpServer())
        .post('/timetable-admin/timetables')
        .set(auth)
        .send({ schoolYearId: year.id, name: 'Timetable', shortName: 'TT' });
      const timetable = body<{ id: string }>(timetableResponse);

      const response = await request(app.getHttpServer())
        .patch(`/timetable-admin/timetables/${timetable.id}`)
        .set(otherAuth)
        .send({ name: 'Hijacked' });

      expect(response.status).toBe(404);
    });
  });

  describe('Scheduling and facility bookings', () => {
    async function setUpClassAndPeriod(
      auth: Record<string, string>,
      school: { id: string },
    ) {
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

      const columnResponse = await request(app.getHttpServer())
        .post('/timetable-admin/columns')
        .set(auth)
        .send({ name: 'Week A', shortName: 'WKA' });
      const column = body<{ id: string }>(columnResponse);
      const rowResponse = await request(app.getHttpServer())
        .post(`/timetable-admin/columns/${column.id}/rows`)
        .set(auth)
        .send({
          name: 'Period 1',
          shortName: 'P1',
          timeStart: '09:00',
          timeEnd: '09:50',
          type: 'Lesson',
        });
      const row = body<{ id: string }>(rowResponse);
      const timetableResponse = await request(app.getHttpServer())
        .post('/timetable-admin/timetables')
        .set(auth)
        .send({ schoolYearId: year.id, name: 'Timetable', shortName: 'TT' });
      const timetable = body<{ id: string }>(timetableResponse);
      const dayResponse = await request(app.getHttpServer())
        .post(`/timetable-admin/timetables/${timetable.id}/days`)
        .set(auth)
        .send({
          timetableColumnId: column.id,
          name: 'Mon A',
          shortName: 'MA',
          color: '#ff0000',
          fontColor: '#ffffff',
        });
      const day = body<{ id: string }>(dayResponse);
      await request(app.getHttpServer())
        .post(`/timetable-admin/days/${day.id}/dates`)
        .set(auth)
        .send({ date: '2026-09-03' });

      return { courseClass, row, day };
    }

    it('schedules a class, then a student can see it on their own schedule', async () => {
      const { auth, school } = await signUpAdmin();
      const { courseClass, row, day } = await setUpClassAndPeriod(auth, school);
      const { personId: studentId, auth: studentAuth } = await addPersonLogin(
        school.id,
        'Student',
        'Student',
      );
      await request(app.getHttpServer())
        .post(`/curriculum/classes/${courseClass.id}/enrolments`)
        .set(auth)
        .send({ personId: studentId, role: 'Student' });

      const scheduleClassResponse = await request(app.getHttpServer())
        .post('/timetable-admin/scheduled-classes')
        .set(auth)
        .send({
          timetableColumnRowId: row.id,
          timetableDayId: day.id,
          courseClassId: courseClass.id,
        });
      expect(scheduleClassResponse.status).toBe(201);

      const scheduleResponse = await request(app.getHttpServer())
        .get('/timetable/schedule')
        .query({ dateStart: '2026-09-01', dateEnd: '2026-09-07' })
        .set(studentAuth);
      expect(scheduleResponse.status).toBe(200);
      expect(body<{ courseClassId: string }[]>(scheduleResponse)).toEqual([
        expect.objectContaining({ courseClassId: courseClass.id }),
      ]);
    });

    it('forbids a student from viewing another student’s schedule by passing their personId', async () => {
      const { auth, school } = await signUpAdmin();
      const { personId: otherStudentId } = await addPersonLogin(
        school.id,
        'Student',
        'Other',
      );
      const { auth: studentAuth } = await addPersonLogin(
        school.id,
        'Student',
        'Self',
      );
      void auth;

      const response = await request(app.getHttpServer())
        .get('/timetable/schedule')
        .query({
          personId: otherStudentId,
          dateStart: '2026-09-01',
          dateEnd: '2026-09-07',
        })
        .set(studentAuth);

      expect(response.status).toBe(403);
    });

    it('rejects double-booking the same room for an overlapping time as a clean 409', async () => {
      const { auth, school } = await signUpAdmin();
      const spaceResponse = await request(app.getHttpServer())
        .post('/school-admin/spaces')
        .set(auth)
        .send({ name: 'Lab 1' });
      const space = body<{ id: string }>(spaceResponse);
      const bookingPayload = {
        spaceId: space.id,
        personId: (await people.find({ where: { schoolId: school.id } }))[0].id,
        date: '2026-09-03',
        timeStart: '10:00',
        timeEnd: '11:00',
        reason: 'Club',
      };
      const first = await request(app.getHttpServer())
        .post('/timetable-admin/facility-bookings')
        .set(auth)
        .send(bookingPayload);
      expect(first.status).toBe(201);

      const second = await request(app.getHttpServer())
        .post('/timetable-admin/facility-bookings')
        .set(auth)
        .send({ ...bookingPayload, timeStart: '10:30', timeEnd: '11:30' });

      expect(second.status).toBe(409);
    });
  });
});
