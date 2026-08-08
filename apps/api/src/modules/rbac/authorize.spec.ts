import { AbilityBuilder, createMongoAbility } from '@casl/ability';
import { NotFoundException } from '@nestjs/common';
import { assertCan } from './authorize';
import type { AppAbility } from './casl-ability.factory';

type ConditionalCanBuilder = (
  verb: string,
  subjectType: string,
  conditions: Record<string, unknown>,
) => void;

function buildAbility(
  configure: (builder: AbilityBuilder<AppAbility>) => void,
): AppAbility {
  const builder = new AbilityBuilder<AppAbility>(createMongoAbility);
  configure(builder);
  return builder.build();
}

// Mirrors casl-ability.factory.ts's documented cast: AppAbility's subject
// slot is plain `string` (free-text catalog design), so passing conditions
// to `can()` needs this same narrow, accepted type-level workaround.
function canWithConditions(
  can: AbilityBuilder<AppAbility>['can'],
  verb: string,
  subjectType: string,
  conditions: Record<string, unknown>,
): void {
  (can as unknown as ConditionalCanBuilder)(verb, subjectType, conditions);
}

describe('assertCan', () => {
  it('does not throw when the ability grants the verb/subject unconditionally', () => {
    const ability = buildAbility(({ can }) => can('view', 'Alert'));

    expect(() =>
      assertCan(ability, 'view', 'Alert', { alertTypeAdminOnly: true }),
    ).not.toThrow();
  });

  it('does not throw when a conditional grant matches the projection', () => {
    const ability = buildAbility(({ can }) =>
      canWithConditions(can, 'view', 'Alert', { alertTypeAdminOnly: true }),
    );

    expect(() =>
      assertCan(ability, 'view', 'Alert', { alertTypeAdminOnly: true }),
    ).not.toThrow();
  });

  it('throws NotFoundException, not ForbiddenException, when a conditional grant does not match the projection', () => {
    // e.g. a role only granted to view non-adminOnly alerts (Manage Student
    // Alerts_my) - fixes the real Gibbon bug where adminOnly only gated
    // alert *creation*, never *viewing*.
    const ability = buildAbility(({ can }) =>
      canWithConditions(can, 'view', 'Alert', { alertTypeAdminOnly: false }),
    );

    expect(() =>
      assertCan(ability, 'view', 'Alert', { alertTypeAdminOnly: true }),
    ).toThrow(NotFoundException);
  });

  it('throws NotFoundException when the ability grants nothing at all for the subject', () => {
    const ability = buildAbility(() => {});

    expect(() =>
      assertCan(ability, 'view', 'Alert', { alertTypeAdminOnly: false }),
    ).toThrow(NotFoundException);
  });
});
