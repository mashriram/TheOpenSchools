import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SchoolsRepository } from '../school/repositories/schools.repository';
import { PeopleRepository } from '../people/repositories/people.repository';
import { PersonCredentialsRepository } from '../people/repositories/person-credentials.repository';
import { PersonRolesRepository } from '../people/repositories/person-roles.repository';
import { RefreshTokensRepository } from './repositories/refresh-tokens.repository';
import { HashingService } from './hashing.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

function buildService() {
  const schools = { findBySlug: jest.fn() };
  const people = { findByEmail: jest.fn(), findOne: jest.fn() };
  const personCredentials = {
    findByPersonId: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };
  const personRoles = { findPrimaryRole: jest.fn(), findByPerson: jest.fn() };
  const refreshTokens = {
    findByTokenHash: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  };
  const hashing = {
    verifyPassword: jest.fn(),
    generateRawToken: jest.fn(),
    hashToken: jest.fn(),
  };
  const jwt = { signAsync: jest.fn() };
  const config = { get: jest.fn().mockReturnValue('test-secret') };

  const service = new AuthService(
    schools as unknown as SchoolsRepository,
    people as unknown as PeopleRepository,
    personCredentials as unknown as PersonCredentialsRepository,
    personRoles as unknown as PersonRolesRepository,
    refreshTokens as unknown as RefreshTokensRepository,
    hashing as unknown as HashingService,
    jwt as unknown as JwtService,
    config as unknown as ConfigService,
  );

  return {
    service,
    schools,
    people,
    personCredentials,
    personRoles,
    refreshTokens,
    hashing,
    jwt,
  };
}

const SCHOOL = { id: 'school-1' };
const PERSON = {
  id: 'person-1',
  schoolId: 'school-1',
  firstName: 'Jane',
  surname: 'Smith',
  email: 'jane@example.com',
};
const CREDENTIAL = {
  id: 'credential-1',
  personId: 'person-1',
  canLogin: true,
  passwordHash: 'hashed',
  failedLoginCount: 0,
};
const PRIMARY_ROLE_LINK = { roleId: 'role-1', isPrimary: true };

describe('AuthService.login', () => {
  it('returns tokens and the active role on success', async () => {
    const {
      service,
      schools,
      people,
      personCredentials,
      personRoles,
      hashing,
      jwt,
      refreshTokens,
    } = buildService();
    schools.findBySlug.mockResolvedValue(SCHOOL);
    people.findByEmail.mockResolvedValue(PERSON);
    personCredentials.findByPersonId.mockResolvedValue({ ...CREDENTIAL });
    hashing.verifyPassword.mockResolvedValue(true);
    personRoles.findPrimaryRole.mockResolvedValue(PRIMARY_ROLE_LINK);
    hashing.generateRawToken.mockReturnValue('raw-refresh-token');
    hashing.hashToken.mockReturnValue('hashed-refresh-token');
    refreshTokens.create.mockImplementation((v: unknown) => v);
    refreshTokens.save.mockImplementation((v: unknown) => Promise.resolve(v));
    jwt.signAsync.mockResolvedValue('signed-access-token');

    const result = await service.login(
      'greenwood',
      'jane@example.com',
      'correct-password',
    );

    expect(result.accessToken).toBe('signed-access-token');
    expect(result.refreshToken).toBe('raw-refresh-token');
    expect(result.activeRoleId).toBe('role-1');
    expect(result.person).toEqual({
      id: 'person-1',
      firstName: 'Jane',
      surname: 'Smith',
      email: 'jane@example.com',
    });
  });

  it('resets failedLoginCount and records lastLoginAt on success', async () => {
    const {
      service,
      schools,
      people,
      personCredentials,
      personRoles,
      hashing,
      jwt,
    } = buildService();
    schools.findBySlug.mockResolvedValue(SCHOOL);
    people.findByEmail.mockResolvedValue(PERSON);
    const credential = { ...CREDENTIAL, failedLoginCount: 3 };
    personCredentials.findByPersonId.mockResolvedValue(credential);
    hashing.verifyPassword.mockResolvedValue(true);
    personRoles.findPrimaryRole.mockResolvedValue(PRIMARY_ROLE_LINK);
    jwt.signAsync.mockResolvedValue('token');

    await service.login('greenwood', 'jane@example.com', 'correct-password');

    const saveCalls = personCredentials.save.mock.calls as unknown[][];
    const saved = saveCalls[0][0] as {
      failedLoginCount: number;
      lastLoginAt: unknown;
    };
    expect(saved.failedLoginCount).toBe(0);
    expect(saved.lastLoginAt).toBeInstanceOf(Date);
  });

  it('throws Unauthorized when the school slug does not exist', async () => {
    const { service, schools } = buildService();
    schools.findBySlug.mockResolvedValue(null);

    await expect(
      service.login('nonexistent', 'jane@example.com', 'x'),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('throws Unauthorized when no person has that email in the school', async () => {
    const { service, schools, people } = buildService();
    schools.findBySlug.mockResolvedValue(SCHOOL);
    people.findByEmail.mockResolvedValue(null);

    await expect(
      service.login('greenwood', 'nobody@example.com', 'x'),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('throws Unauthorized when the person has no credential record', async () => {
    const { service, schools, people, personCredentials } = buildService();
    schools.findBySlug.mockResolvedValue(SCHOOL);
    people.findByEmail.mockResolvedValue(PERSON);
    personCredentials.findByPersonId.mockResolvedValue(null);

    await expect(
      service.login('greenwood', 'jane@example.com', 'x'),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('throws Unauthorized when canLogin is false', async () => {
    const { service, schools, people, personCredentials } = buildService();
    schools.findBySlug.mockResolvedValue(SCHOOL);
    people.findByEmail.mockResolvedValue(PERSON);
    personCredentials.findByPersonId.mockResolvedValue({
      ...CREDENTIAL,
      canLogin: false,
    });

    await expect(
      service.login('greenwood', 'jane@example.com', 'x'),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('throws Unauthorized and increments failedLoginCount on a wrong password', async () => {
    const { service, schools, people, personCredentials, hashing } =
      buildService();
    schools.findBySlug.mockResolvedValue(SCHOOL);
    people.findByEmail.mockResolvedValue(PERSON);
    const credential = { ...CREDENTIAL, failedLoginCount: 0 };
    personCredentials.findByPersonId.mockResolvedValue(credential);
    hashing.verifyPassword.mockResolvedValue(false);

    await expect(
      service.login('greenwood', 'jane@example.com', 'wrong'),
    ).rejects.toThrow(UnauthorizedException);
    expect(personCredentials.save).toHaveBeenCalledWith(
      expect.objectContaining({ failedLoginCount: 1 }),
    );
  });

  it('throws Unauthorized when the person has no assigned role at all', async () => {
    const {
      service,
      schools,
      people,
      personCredentials,
      personRoles,
      hashing,
    } = buildService();
    schools.findBySlug.mockResolvedValue(SCHOOL);
    people.findByEmail.mockResolvedValue(PERSON);
    personCredentials.findByPersonId.mockResolvedValue({ ...CREDENTIAL });
    hashing.verifyPassword.mockResolvedValue(true);
    personRoles.findPrimaryRole.mockResolvedValue(null);
    personRoles.findByPerson.mockResolvedValue([]);

    await expect(
      service.login('greenwood', 'jane@example.com', 'correct-password'),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('falls back to the first assigned role when no role is marked primary', async () => {
    const {
      service,
      schools,
      people,
      personCredentials,
      personRoles,
      hashing,
      jwt,
    } = buildService();
    schools.findBySlug.mockResolvedValue(SCHOOL);
    people.findByEmail.mockResolvedValue(PERSON);
    personCredentials.findByPersonId.mockResolvedValue({ ...CREDENTIAL });
    hashing.verifyPassword.mockResolvedValue(true);
    personRoles.findPrimaryRole.mockResolvedValue(null);
    personRoles.findByPerson.mockResolvedValue([{ roleId: 'fallback-role' }]);
    jwt.signAsync.mockResolvedValue('token');

    const result = await service.login(
      'greenwood',
      'jane@example.com',
      'correct-password',
    );

    expect(result.activeRoleId).toBe('fallback-role');
  });
});

describe('AuthService.refresh', () => {
  it('rotates the refresh token and returns new tokens', async () => {
    const {
      service,
      refreshTokens,
      personCredentials,
      people,
      personRoles,
      hashing,
      jwt,
    } = buildService();
    hashing.hashToken.mockReturnValue('hashed-old-token');
    const storedToken = {
      id: 'rt-1',
      personCredentialId: 'credential-1',
      expiresAt: new Date(Date.now() + 1000 * 60 * 60),
      revokedAt: null,
    };
    refreshTokens.findByTokenHash.mockResolvedValue(storedToken);
    refreshTokens.save.mockImplementation((v) => Promise.resolve(v));
    personCredentials.findOne.mockResolvedValue({ ...CREDENTIAL });
    people.findOne.mockResolvedValue(PERSON);
    personRoles.findPrimaryRole.mockResolvedValue(PRIMARY_ROLE_LINK);
    hashing.generateRawToken.mockReturnValue('new-raw-token');
    jwt.signAsync.mockResolvedValue('new-access-token');

    const result = await service.refresh('old-raw-token');

    expect(storedToken.revokedAt).not.toBeNull();
    expect(result.accessToken).toBe('new-access-token');
    expect(result.refreshToken).toBe('new-raw-token');
  });

  it('throws Unauthorized for an unknown token', async () => {
    const { service, hashing, refreshTokens } = buildService();
    hashing.hashToken.mockReturnValue('hashed');
    refreshTokens.findByTokenHash.mockResolvedValue(null);

    await expect(service.refresh('unknown')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('throws Unauthorized for an already-revoked token', async () => {
    const { service, hashing, refreshTokens } = buildService();
    hashing.hashToken.mockReturnValue('hashed');
    refreshTokens.findByTokenHash.mockResolvedValue({
      revokedAt: new Date(),
      expiresAt: new Date(Date.now() + 100000),
    });

    await expect(service.refresh('revoked')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('throws Unauthorized for an expired token', async () => {
    const { service, hashing, refreshTokens } = buildService();
    hashing.hashToken.mockReturnValue('hashed');
    refreshTokens.findByTokenHash.mockResolvedValue({
      revokedAt: null,
      expiresAt: new Date(Date.now() - 1000),
    });

    await expect(service.refresh('expired')).rejects.toThrow(
      UnauthorizedException,
    );
  });
});

describe('AuthService.logout', () => {
  it('revokes a valid, unrevoked token', async () => {
    const { service, hashing, refreshTokens } = buildService();
    hashing.hashToken.mockReturnValue('hashed');
    const stored = { revokedAt: null };
    refreshTokens.findByTokenHash.mockResolvedValue(stored);
    refreshTokens.save.mockImplementation((v) => Promise.resolve(v));

    await service.logout('raw-token');

    expect(stored.revokedAt).not.toBeNull();
    expect(refreshTokens.save).toHaveBeenCalledWith(stored);
  });

  it('does nothing for an unknown token (no error thrown)', async () => {
    const { service, hashing, refreshTokens } = buildService();
    hashing.hashToken.mockReturnValue('hashed');
    refreshTokens.findByTokenHash.mockResolvedValue(null);

    await expect(service.logout('unknown')).resolves.toBeUndefined();
    expect(refreshTokens.save).not.toHaveBeenCalled();
  });

  it('does not re-save an already-revoked token', async () => {
    const { service, hashing, refreshTokens } = buildService();
    hashing.hashToken.mockReturnValue('hashed');
    refreshTokens.findByTokenHash.mockResolvedValue({ revokedAt: new Date() });

    await service.logout('already-revoked');

    expect(refreshTokens.save).not.toHaveBeenCalled();
  });
});

describe('AuthService.switchRole', () => {
  const CURRENT_USER = {
    sub: 'person-1',
    schoolId: 'school-1',
    activeRoleId: 'role-1',
  };

  it('issues a new access token when the role is assigned to the person', async () => {
    const { service, personRoles, jwt } = buildService();
    personRoles.findByPerson.mockResolvedValue([
      { roleId: 'role-1' },
      { roleId: 'role-2' },
    ]);
    jwt.signAsync.mockResolvedValue('new-token');

    const token = await service.switchRole(CURRENT_USER, 'role-2');

    expect(token).toBe('new-token');
    expect(jwt.signAsync).toHaveBeenCalledWith(
      { sub: 'person-1', schoolId: 'school-1', activeRoleId: 'role-2' },
      expect.anything(),
    );
  });

  it('throws Unauthorized when the requested role is not assigned to the person', async () => {
    const { service, personRoles } = buildService();
    personRoles.findByPerson.mockResolvedValue([{ roleId: 'role-1' }]);

    await expect(
      service.switchRole(CURRENT_USER, 'role-not-assigned'),
    ).rejects.toThrow(UnauthorizedException);
  });
});
