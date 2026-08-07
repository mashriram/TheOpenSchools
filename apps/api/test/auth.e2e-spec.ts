import { randomUUID } from 'node:crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { SchoolsRepository } from '../src/modules/school/repositories/schools.repository';
import { PeopleRepository } from '../src/modules/people/repositories/people.repository';
import { PersonCredentialsRepository } from '../src/modules/people/repositories/person-credentials.repository';
import { PersonRolesRepository } from '../src/modules/people/repositories/person-roles.repository';
import { RolesRepository } from '../src/modules/rbac/repositories/roles.repository';
import { HashingService } from '../src/modules/auth/hashing.service';

const PASSWORD = 'correct-horse-battery-staple';

interface AuthResponseBody {
  accessToken: string;
  person: {
    id: string;
    firstName: string;
    surname: string;
    email: string | null;
  };
  activeRoleId: string;
}

/** supertest types response.body as `any`; this is the one place that cast happens. */
function authBody(response: request.Response): AuthResponseBody {
  return response.body as AuthResponseBody;
}

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;
  let schools: SchoolsRepository;
  let people: PeopleRepository;
  let personCredentials: PersonCredentialsRepository;
  let personRoles: PersonRolesRepository;
  let roles: RolesRepository;
  let hashing: HashingService;
  let createdSchoolIds: string[];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    schools = moduleFixture.get(SchoolsRepository);
    people = moduleFixture.get(PeopleRepository);
    personCredentials = moduleFixture.get(PersonCredentialsRepository);
    personRoles = moduleFixture.get(PersonRolesRepository);
    roles = moduleFixture.get(RolesRepository);
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

  /** Seeds a full login-ready user, bypassing signup (M7, not built yet). */
  async function seedLoginableUser(
    overrides: { canLogin?: boolean; email?: string } = {},
  ) {
    const school = await schools.save(
      schools.create({ name: 'Greenwood High', subdomainSlug: randomUUID() }),
    );
    createdSchoolIds.push(school.id);

    const email = overrides.email ?? `${randomUUID()}@example.com`;
    const person = await people.save(
      people.create({
        schoolId: school.id,
        surname: 'Smith',
        firstName: 'Jane',
        email,
      }),
    );

    const role = await roles.save(
      roles.create({
        schoolId: school.id,
        category: 'Staff',
        name: 'Administrator',
        shortName: 'Adm',
        description: 'Controls all aspects of the system',
        restriction: 'AdminOnly',
      }),
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
        schoolId: school.id,
        username: email,
        passwordHash: await hashing.hashPassword(PASSWORD),
        canLogin: overrides.canLogin ?? true,
      }),
    );

    return { school, person, role, email };
  }

  function extractRefreshCookie(response: request.Response): string {
    const setCookie = response.headers['set-cookie'] as unknown as string[];
    const cookie = setCookie?.find((c) => c.startsWith('refreshToken='));
    if (!cookie) {
      throw new Error('No refreshToken cookie was set');
    }
    return cookie.split(';')[0];
  }

  describe('POST /auth/login', () => {
    it('logs in with correct credentials and sets an httpOnly refresh cookie', async () => {
      const { school, email } = await seedLoginableUser();

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ schoolSlug: school.subdomainSlug, email, password: PASSWORD });

      expect(response.status).toBe(201);
      expect(authBody(response).accessToken).toBeDefined();
      expect(authBody(response).person.email).toBe(email);
      expect(authBody(response).activeRoleId).toBeDefined();

      const setCookie = response.headers['set-cookie'] as unknown as string[];
      const refreshCookie = setCookie.find((c) =>
        c.startsWith('refreshToken='),
      );
      expect(refreshCookie).toContain('HttpOnly');
    });

    it('rejects an incorrect password', async () => {
      const { school, email } = await seedLoginableUser();

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          schoolSlug: school.subdomainSlug,
          email,
          password: 'wrong-password',
        });

      expect(response.status).toBe(401);
    });

    it('rejects an unknown school slug', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          schoolSlug: 'does-not-exist',
          email: 'a@b.com',
          password: PASSWORD,
        });

      expect(response.status).toBe(401);
    });

    it('rejects an unknown email within a real school', async () => {
      const { school } = await seedLoginableUser();

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          schoolSlug: school.subdomainSlug,
          email: 'nobody@example.com',
          password: PASSWORD,
        });

      expect(response.status).toBe(401);
    });

    it('rejects a disabled account (canLogin=false)', async () => {
      const { school, email } = await seedLoginableUser({ canLogin: false });

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ schoolSlug: school.subdomainSlug, email, password: PASSWORD });

      expect(response.status).toBe(401);
    });

    it('rejects the correct email+password combination scoped to the wrong school', async () => {
      const { email } = await seedLoginableUser();
      const otherSchool = await seedLoginableUser();

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          schoolSlug: otherSchool.school.subdomainSlug,
          email,
          password: PASSWORD,
        });

      expect(response.status).toBe(401);
    });

    it('returns 400 for a malformed request body', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ schoolSlug: 'x', email: 'not-an-email', password: '' });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /auth/refresh', () => {
    it('issues a new access token given a valid refresh cookie', async () => {
      const { school, email } = await seedLoginableUser();
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ schoolSlug: school.subdomainSlug, email, password: PASSWORD });
      const refreshCookie = extractRefreshCookie(loginResponse);

      const refreshResponse = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', refreshCookie);

      expect(refreshResponse.status).toBe(201);
      expect(authBody(refreshResponse).accessToken).toBeDefined();
      // Not asserting the access token differs from login's: a JWT is
      // deterministic given identical payload + iat + exp + secret, and
      // iat/exp are second-granularity, so issuing within the same wall-clock
      // second as login can legitimately produce a byte-identical token.
      // What actually matters - that the old refresh token can't be reused -
      // is covered separately below.
      expect(authBody(refreshResponse).person.email).toBe(email);
    });

    it('rejects a request with no refresh cookie', async () => {
      const response = await request(app.getHttpServer()).post('/auth/refresh');

      expect(response.status).toBe(401);
    });

    it('rejects reusing a refresh token that was already rotated', async () => {
      const { school, email } = await seedLoginableUser();
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ schoolSlug: school.subdomainSlug, email, password: PASSWORD });
      const refreshCookie = extractRefreshCookie(loginResponse);

      await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', refreshCookie);
      const secondUse = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', refreshCookie);

      expect(secondUse.status).toBe(401);
    });

    it('rejects a garbage refresh token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', 'refreshToken=not-a-real-token');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /auth/logout', () => {
    it('revokes the refresh token so it can no longer be used', async () => {
      const { school, email } = await seedLoginableUser();
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ schoolSlug: school.subdomainSlug, email, password: PASSWORD });
      const refreshCookie = extractRefreshCookie(loginResponse);

      const logoutResponse = await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Cookie', refreshCookie);
      expect(logoutResponse.status).toBe(204);

      const refreshAfterLogout = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', refreshCookie);
      expect(refreshAfterLogout.status).toBe(401);
    });

    it('does not error when there is no refresh cookie to revoke', async () => {
      const response = await request(app.getHttpServer()).post('/auth/logout');

      expect(response.status).toBe(204);
    });
  });

  describe('POST /auth/switch-role', () => {
    it('rejects a request with no access token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/switch-role')
        .send({ roleId: randomUUID() });

      expect(response.status).toBe(401);
    });

    it('issues a new access token when switching to a role assigned to the person', async () => {
      const { school, person, email } = await seedLoginableUser();
      const secondRole = await roles.save(
        roles.create({
          schoolId: school.id,
          category: 'Staff',
          name: 'Teacher',
          shortName: 'Tcr',
          description: 'Regular, classroom teacher',
          restriction: 'None',
        }),
      );
      await personRoles.save(
        personRoles.create({ personId: person.id, roleId: secondRole.id }),
      );

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ schoolSlug: school.subdomainSlug, email, password: PASSWORD });

      const switchResponse = await request(app.getHttpServer())
        .post('/auth/switch-role')
        .set('Authorization', `Bearer ${authBody(loginResponse).accessToken}`)
        .send({ roleId: secondRole.id });

      expect(switchResponse.status).toBe(201);
      expect(authBody(switchResponse).accessToken).toBeDefined();
      expect(authBody(switchResponse).accessToken).not.toBe(
        authBody(loginResponse).accessToken,
      );
    });

    it('rejects switching to a role not assigned to the person', async () => {
      const { school, email } = await seedLoginableUser();
      const otherSchoolUser = await seedLoginableUser();

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ schoolSlug: school.subdomainSlug, email, password: PASSWORD });

      const switchResponse = await request(app.getHttpServer())
        .post('/auth/switch-role')
        .set('Authorization', `Bearer ${authBody(loginResponse).accessToken}`)
        .send({ roleId: otherSchoolUser.role.id });

      expect(switchResponse.status).toBe(401);
    });

    it('rejects a malformed roleId', async () => {
      const { school, email } = await seedLoginableUser();
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ schoolSlug: school.subdomainSlug, email, password: PASSWORD });

      const switchResponse = await request(app.getHttpServer())
        .post('/auth/switch-role')
        .set('Authorization', `Bearer ${authBody(loginResponse).accessToken}`)
        .send({ roleId: 'not-a-uuid' });

      expect(switchResponse.status).toBe(400);
    });
  });
});
