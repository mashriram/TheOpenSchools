import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PoliciesGuard } from './policies.guard';
import { CaslAbilityFactory } from './casl-ability.factory';

function buildContext(user: {
  schoolId: string;
  activeRoleId: string;
}): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as unknown as ExecutionContext;
}

describe('PoliciesGuard', () => {
  const USER = { schoolId: 'school-1', activeRoleId: 'role-1' };
  let reflector: { getAllAndOverride: jest.Mock };
  let abilityFactory: { buildAbilityForRole: jest.Mock };
  let guard: PoliciesGuard;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() };
    abilityFactory = { buildAbilityForRole: jest.fn() };
    guard = new PoliciesGuard(
      reflector as unknown as Reflector,
      abilityFactory as unknown as CaslAbilityFactory,
    );
  });

  it('allows the request when no @CheckPolicies handlers are set', async () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);

    const allowed = await guard.canActivate(buildContext(USER));

    expect(allowed).toBe(true);
    expect(abilityFactory.buildAbilityForRole).not.toHaveBeenCalled();
  });

  it('allows the request when every policy handler passes', async () => {
    reflector.getAllAndOverride.mockReturnValue([() => true, () => true]);
    abilityFactory.buildAbilityForRole.mockResolvedValue('fake-ability');

    const allowed = await guard.canActivate(buildContext(USER));

    expect(allowed).toBe(true);
  });

  it('builds the ability using the schoolId and activeRoleId from the request user', async () => {
    reflector.getAllAndOverride.mockReturnValue([() => true]);
    abilityFactory.buildAbilityForRole.mockResolvedValue('fake-ability');

    await guard.canActivate(buildContext(USER));

    expect(abilityFactory.buildAbilityForRole).toHaveBeenCalledWith(
      'school-1',
      'role-1',
    );
  });

  it('throws Forbidden when any policy handler fails', async () => {
    reflector.getAllAndOverride.mockReturnValue([() => true, () => false]);
    abilityFactory.buildAbilityForRole.mockResolvedValue('fake-ability');

    await expect(guard.canActivate(buildContext(USER))).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('passes the built ability into each policy handler', async () => {
    const handler = jest.fn().mockReturnValue(true);
    reflector.getAllAndOverride.mockReturnValue([handler]);
    abilityFactory.buildAbilityForRole.mockResolvedValue('the-ability');

    await guard.canActivate(buildContext(USER));

    expect(handler).toHaveBeenCalledWith('the-ability');
  });
});
