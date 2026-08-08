import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { SchoolsRepository } from '../school/repositories/schools.repository';
import { PeopleRepository } from '../people/repositories/people.repository';
import { PersonCredentialsRepository } from '../people/repositories/person-credentials.repository';
import { PersonRolesRepository } from '../people/repositories/person-roles.repository';
import { RefreshTokensRepository } from './repositories/refresh-tokens.repository';
import { HashingService } from './hashing.service';
import { AccessTokenPayload } from './access-token-payload';
import { getRequiredEnv } from '../../common/get-required-env';

const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  person: {
    id: string;
    firstName: string;
    surname: string;
    email: string | null;
  };
  activeRoleId: string;
}

@Injectable()
export class AuthService {
  private readonly jwtAccessSecret: string;

  constructor(
    private readonly schools: SchoolsRepository,
    private readonly people: PeopleRepository,
    private readonly personCredentials: PersonCredentialsRepository,
    private readonly personRoles: PersonRolesRepository,
    private readonly refreshTokens: RefreshTokensRepository,
    private readonly hashing: HashingService,
    private readonly jwt: JwtService,
    config: ConfigService,
  ) {
    this.jwtAccessSecret = getRequiredEnv(config, 'JWT_ACCESS_SECRET');
  }

  async login(
    schoolSlug: string,
    email: string,
    password: string,
  ): Promise<AuthResult> {
    const school = await this.schools.findBySlug(schoolSlug);
    if (!school) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const person = await this.people.findByEmail(school.id, email);
    if (!person) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const credential = await this.personCredentials.findByPersonId(person.id);
    if (!credential || !credential.canLogin) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await this.hashing.verifyPassword(
      credential.passwordHash,
      password,
    );
    if (!passwordValid) {
      credential.failedLoginCount += 1;
      credential.lastFailedLoginAt = new Date();
      await this.personCredentials.save(credential);
      throw new UnauthorizedException('Invalid credentials');
    }

    const activeRole =
      (await this.personRoles.findPrimaryRole(person.id)) ??
      (await this.personRoles.findByPerson(person.id))[0];
    if (!activeRole) {
      throw new UnauthorizedException('This account has no assigned role');
    }

    credential.failedLoginCount = 0;
    credential.lastLoginAt = new Date();
    await this.personCredentials.save(credential);

    return this.issueTokens(person, credential.id, activeRole.roleId);
  }

  async refresh(rawRefreshToken: string): Promise<AuthResult> {
    const tokenHash = this.hashing.hashToken(rawRefreshToken);
    const stored = await this.refreshTokens.findByTokenHash(tokenHash);

    if (
      !stored ||
      stored.revokedAt ||
      stored.expiresAt.getTime() < Date.now()
    ) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    stored.revokedAt = new Date();
    await this.refreshTokens.save(stored);

    const credential = await this.personCredentials.findOne({
      where: { id: stored.personCredentialId },
    });
    if (!credential) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const person = await this.people.findOne({
      where: { id: credential.personId },
    });
    if (!person) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const activeRole =
      (await this.personRoles.findPrimaryRole(person.id)) ??
      (await this.personRoles.findByPerson(person.id))[0];
    if (!activeRole) {
      throw new UnauthorizedException('This account has no assigned role');
    }

    return this.issueTokens(person, credential.id, activeRole.roleId);
  }

  async logout(rawRefreshToken: string): Promise<void> {
    const tokenHash = this.hashing.hashToken(rawRefreshToken);
    const stored = await this.refreshTokens.findByTokenHash(tokenHash);
    if (stored && !stored.revokedAt) {
      stored.revokedAt = new Date();
      await this.refreshTokens.save(stored);
    }
  }

  /**
   * Mirrors Gibbon's roleSwitcherProcess.php: validates the requested role
   * is one of the person's assigned roles and issues a new access token -
   * no database write, exactly like Gibbon's session-only role switch.
   */
  async switchRole(
    currentUser: AccessTokenPayload,
    requestedRoleId: string,
  ): Promise<string> {
    const assignedRoles = await this.personRoles.findByPerson(currentUser.sub);
    const isAssigned = assignedRoles.some(
      (pr) => pr.roleId === requestedRoleId,
    );
    if (!isAssigned) {
      throw new UnauthorizedException(
        'That role is not assigned to this person',
      );
    }

    return this.signAccessToken({
      sub: currentUser.sub,
      schoolId: currentUser.schoolId,
      activeRoleId: requestedRoleId,
    });
  }

  /**
   * Public (not just an internal helper): SignupService (M7) calls this
   * directly after its own transaction commits, to log the newly-created
   * admin in immediately with the same response shape as a normal login.
   */
  async issueTokens(
    person: {
      id: string;
      schoolId: string;
      firstName: string;
      surname: string;
      email: string | null;
    },
    personCredentialId: string,
    activeRoleId: string,
  ): Promise<AuthResult> {
    const accessToken = await this.signAccessToken({
      sub: person.id,
      schoolId: person.schoolId,
      activeRoleId,
    });

    const rawRefreshToken = this.hashing.generateRawToken();
    await this.refreshTokens.save(
      this.refreshTokens.create({
        personCredentialId,
        tokenHash: this.hashing.hashToken(rawRefreshToken),
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      }),
    );

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      person: {
        id: person.id,
        firstName: person.firstName,
        surname: person.surname,
        email: person.email,
      },
      activeRoleId,
    };
  }

  private signAccessToken(payload: AccessTokenPayload): Promise<string> {
    return this.jwt.signAsync(payload, {
      secret: this.jwtAccessSecret,
      expiresIn: ACCESS_TOKEN_TTL,
    });
  }
}
