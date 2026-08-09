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

describe('Calendar (e2e)', () => {
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

  describe('Calendars', () => {
    it('creates, lists, and updates a calendar', async () => {
      const { auth, school } = await signUpAdmin();
      const [year] = await schoolYears.findBySchool(school.id);

      const createResponse = await request(app.getHttpServer())
        .post('/calendar/calendars')
        .query({ schoolYearId: year.id })
        .set(auth)
        .send({ name: 'Whole School', public: true });
      expect(createResponse.status).toBe(201);
      const calendar = body<{ id: string }>(createResponse);

      const listResponse = await request(app.getHttpServer())
        .get('/calendar/calendars')
        .query({ schoolYearId: year.id })
        .set(auth);
      expect(listResponse.status).toBe(200);
      expect(body<{ id: string }[]>(listResponse)).toEqual([
        expect.objectContaining({ id: calendar.id }),
      ]);

      const updateResponse = await request(app.getHttpServer())
        .patch(`/calendar/calendars/${calendar.id}`)
        .set(auth)
        .send({ name: 'Renamed Calendar' });
      expect(updateResponse.status).toBe(200);
      expect(body<{ name: string }>(updateResponse).name).toBe(
        'Renamed Calendar',
      );
    });

    it('rejects a Teacher creating a calendar container (Admin only)', async () => {
      const { school } = await signUpAdmin();
      const [year] = await schoolYears.findBySchool(school.id);
      const { auth: teacherAuth } = await addPersonLogin(
        school.id,
        'Teacher',
        'Teacher',
      );

      const response = await request(app.getHttpServer())
        .post('/calendar/calendars')
        .query({ schoolYearId: year.id })
        .set(teacherAuth)
        .send({ name: 'Whole School' });

      expect(response.status).toBe(403);
    });

    it('returns 404 for a nonexistent calendar id', async () => {
      const { auth } = await signUpAdmin();

      const response = await request(app.getHttpServer())
        .patch(`/calendar/calendars/${randomUUID()}`)
        .set(auth)
        .send({ name: 'Nope' });

      expect(response.status).toBe(404);
    });

    it('rejects an invalid payload with 400', async () => {
      const { auth, school } = await signUpAdmin();
      const [year] = await schoolYears.findBySchool(school.id);

      const response = await request(app.getHttpServer())
        .post('/calendar/calendars')
        .query({ schoolYearId: year.id })
        .set(auth)
        .send({});

      expect(response.status).toBe(400);
    });

    it('rejects an unauthenticated request with 401', async () => {
      const response = await request(app.getHttpServer()).get(
        '/calendar/calendars',
      );
      expect(response.status).toBe(401);
    });
  });

  describe('Calendar events and visibility', () => {
    it('creates an event visible to a broad viewer and merges it into /me/schedule', async () => {
      const { auth, school } = await signUpAdmin();
      const [year] = await schoolYears.findBySchool(school.id);
      const { personId: teacherId, auth: teacherAuth } = await addPersonLogin(
        school.id,
        'Teacher',
        'Teacher',
      );

      const calendarResponse = await request(app.getHttpServer())
        .post('/calendar/calendars')
        .query({ schoolYearId: year.id })
        .set(auth)
        .send({ name: 'Whole School', public: true });
      const calendar = body<{ id: string }>(calendarResponse);

      const eventResponse = await request(app.getHttpServer())
        .post('/calendar/events')
        .query({ calendarId: calendar.id })
        .set(auth)
        .send({
          name: 'Sports Day',
          dateStart: '2026-09-10',
          dateEnd: '2026-09-10',
        });
      expect(eventResponse.status).toBe(201);
      const event = body<{ id: string }>(eventResponse);

      const scheduleResponse = await request(app.getHttpServer())
        .get('/me/schedule')
        .query({
          schoolYearId: year.id,
          dateStart: '2026-09-01',
          dateEnd: '2026-09-30',
        })
        .set(teacherAuth);

      expect(scheduleResponse.status).toBe(200);
      const schedule = body<{ events: { id: string }[] }>(scheduleResponse);
      expect(schedule.events).toEqual([
        expect.objectContaining({ id: event.id }),
      ]);

      const addParticipantResponse = await request(app.getHttpServer())
        .post(`/calendar/events/${event.id}/participants`)
        .set(auth)
        .send({ personId: teacherId, role: 'Organiser' });
      expect(addParticipantResponse.status).toBe(201);
    });

    it('rejects a Student managing an event (view-only default grant)', async () => {
      const { auth, school } = await signUpAdmin();
      const [year] = await schoolYears.findBySchool(school.id);
      const { auth: studentAuth } = await addPersonLogin(
        school.id,
        'Student',
        'Student',
      );
      const calendarResponse = await request(app.getHttpServer())
        .post('/calendar/calendars')
        .query({ schoolYearId: year.id })
        .set(auth)
        .send({ name: 'Whole School' });
      const calendar = body<{ id: string }>(calendarResponse);

      const response = await request(app.getHttpServer())
        .post('/calendar/events')
        .query({ calendarId: calendar.id })
        .set(studentAuth)
        .send({
          name: 'Sports Day',
          dateStart: '2026-09-10',
          dateEnd: '2026-09-10',
        });

      expect(response.status).toBe(403);
    });

    it('returns 404 listing events for a nonexistent calendar', async () => {
      const { auth } = await signUpAdmin();

      const response = await request(app.getHttpServer())
        .get('/calendar/events')
        .query({ calendarId: randomUUID() })
        .set(auth);

      expect(response.status).toBe(404);
    });
  });

  it('is forbidden for an actor with no grants at all', async () => {
    const { school } = await signUpAdmin();
    const noGrantsAuth = await addNoGrantsLogin(school.id);

    const response = await request(app.getHttpServer())
      .get('/calendar/event-types')
      .set(noGrantsAuth);

    expect(response.status).toBe(403);
  });
});
