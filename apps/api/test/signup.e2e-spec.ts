import { randomUUID } from 'node:crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { SchoolsRepository } from '../src/modules/school/repositories/schools.repository';
import { RolesRepository } from '../src/modules/rbac/repositories/roles.repository';

const VALID_PASSWORD = 'correct-horse-battery-staple';

interface SignupResponseBody {
  accessToken: string;
  person: {
    id: string;
    firstName: string;
    surname: string;
    email: string | null;
  };
  activeRoleId: string;
}

function body<T>(response: request.Response): T {
  return response.body as T;
}

describe('Signup (e2e)', () => {
  let app: INestApplication<App>;
  let schools: SchoolsRepository;
  let roles: RolesRepository;
  let createdSchoolIds: string[];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    schools = moduleFixture.get(SchoolsRepository);
    roles = moduleFixture.get(RolesRepository);
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

  function validPayload(overrides: Record<string, unknown> = {}) {
    return {
      schoolName: 'Greenwood High',
      subdomainSlug: randomUUID().replace(/-/g, '').slice(0, 20),
      adminEmail: `${randomUUID()}@example.com`,
      adminPassword: VALID_PASSWORD,
      adminFirstName: 'Ada',
      adminSurname: 'Admin',
      ...overrides,
    };
  }

  it('creates a school and immediately authenticates the new admin', async () => {
    const payload = validPayload();

    const response = await request(app.getHttpServer())
      .post('/auth/signup')
      .send(payload);

    expect(response.status).toBe(201);
    const school = await schools.findBySlug(payload.subdomainSlug);
    expect(school).not.toBeNull();
    createdSchoolIds.push(school!.id);

    const signupBody = body<SignupResponseBody>(response);
    expect(signupBody.accessToken).toBeDefined();
    expect(signupBody.person.email).toBe(payload.adminEmail);
    expect(response.headers['set-cookie']).toBeDefined();

    // The new admin can immediately use their access token against a
    // CASL-guarded route - proves the whole M1+M2+M4+M5+M6+M7 chain works,
    // not just that a School row was inserted.
    const abilitiesResponse = await request(app.getHttpServer())
      .get('/me/abilities')
      .set('Authorization', `Bearer ${signupBody.accessToken}`);
    expect(abilitiesResponse.status).toBe(200);
    const rules = body<{ rules: { action: string; subject: string }[] }>(
      abilitiesResponse,
    ).rules;
    expect(rules.some((r) => r.subject === 'Role')).toBe(true);

    const rolesResponse = await request(app.getHttpServer())
      .get('/rbac/roles')
      .set('Authorization', `Bearer ${signupBody.accessToken}`);
    expect(rolesResponse.status).toBe(200);
    expect(
      body<{ name: string }[]>(rolesResponse)
        .map((r) => r.name)
        .sort(),
    ).toEqual(
      ['Administrator', 'Parent', 'Student', 'Support Staff', 'Teacher'].sort(),
    );
  });

  it('can immediately log in again with the same credentials (password was really persisted)', async () => {
    const payload = validPayload();
    await request(app.getHttpServer()).post('/auth/signup').send(payload);
    const school = await schools.findBySlug(payload.subdomainSlug);
    createdSchoolIds.push(school!.id);

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        schoolSlug: payload.subdomainSlug,
        email: payload.adminEmail,
        password: payload.adminPassword,
      });

    expect(loginResponse.status).toBe(201);
    expect(body<SignupResponseBody>(loginResponse).person.email).toBe(
      payload.adminEmail,
    );
  });

  it('rejects a duplicate subdomain slug with 409', async () => {
    const payload = validPayload();
    await request(app.getHttpServer()).post('/auth/signup').send(payload);
    const school = await schools.findBySlug(payload.subdomainSlug);
    createdSchoolIds.push(school!.id);

    const response = await request(app.getHttpServer())
      .post('/auth/signup')
      .send(validPayload({ subdomainSlug: payload.subdomainSlug }));

    expect(response.status).toBe(409);
  });

  it('rejects a weak (too short) password with 400', async () => {
    const payload = validPayload({ adminPassword: 'short1' });

    const response = await request(app.getHttpServer())
      .post('/auth/signup')
      .send(payload);

    expect(response.status).toBe(400);
    expect(await schools.findBySlug(payload.subdomainSlug)).toBeNull();
  });

  it.each([
    ['uppercase', 'GreenwoodHigh'],
    ['underscore', 'greenwood_high'],
    ['leading hyphen', '-greenwood'],
    ['dot', 'green.wood'],
  ])(
    'rejects a malformed subdomain slug (%s) with 400',
    async (_label, slug) => {
      const payload = validPayload({ subdomainSlug: slug });

      const response = await request(app.getHttpServer())
        .post('/auth/signup')
        .send(payload);

      expect(response.status).toBe(400);
    },
  );

  it('rejects a malformed admin email with 400', async () => {
    const payload = validPayload({ adminEmail: 'not-an-email' });

    const response = await request(app.getHttpServer())
      .post('/auth/signup')
      .send(payload);

    expect(response.status).toBe(400);
  });

  it('rejects a missing required field with 400', async () => {
    const payload = validPayload();
    delete (payload as Record<string, unknown>).schoolName;

    const response = await request(app.getHttpServer())
      .post('/auth/signup')
      .send(payload);

    expect(response.status).toBe(400);
  });

  it('allows the same admin email to be reused across two different (unrelated) schools', async () => {
    const sharedEmail = `${randomUUID()}@example.com`;
    const firstPayload = validPayload({ adminEmail: sharedEmail });
    const secondPayload = validPayload({ adminEmail: sharedEmail });

    const firstResponse = await request(app.getHttpServer())
      .post('/auth/signup')
      .send(firstPayload);
    const secondResponse = await request(app.getHttpServer())
      .post('/auth/signup')
      .send(secondPayload);

    expect(firstResponse.status).toBe(201);
    expect(secondResponse.status).toBe(201);

    const firstSchool = await schools.findBySlug(firstPayload.subdomainSlug);
    const secondSchool = await schools.findBySlug(secondPayload.subdomainSlug);
    createdSchoolIds.push(firstSchool!.id, secondSchool!.id);
    expect(firstSchool!.id).not.toBe(secondSchool!.id);
  });

  it('seeds all 5 Core roles as immutable (rejecting an attempt to edit one)', async () => {
    const payload = validPayload();
    const signupResponse = await request(app.getHttpServer())
      .post('/auth/signup')
      .send(payload);
    const school = await schools.findBySlug(payload.subdomainSlug);
    createdSchoolIds.push(school!.id);
    const accessToken = body<SignupResponseBody>(signupResponse).accessToken;

    const createdRoles = await roles.findBySchool(school!.id);
    const teacherRole = createdRoles.find((r) => r.name === 'Teacher')!;

    const response = await request(app.getHttpServer())
      .patch(`/rbac/roles/${teacherRole.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ description: 'Attempting to edit a seeded Core role' });

    expect(response.status).toBe(400);
  });
});
