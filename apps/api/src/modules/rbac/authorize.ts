import { ForbiddenError, subject } from '@casl/ability';
import { NotFoundException } from '@nestjs/common';
import type { AppAbility } from './casl-ability.factory';

/**
 * Row-level authorization check for a single already-fetched record (see
 * plan §Data Safety Design B) - the coarse @CheckPolicies() guard check on
 * the route only ever sees a static verb/subject pair with no instance
 * data, so this is the seam where a Tier C permission's real conditions
 * (e.g. "can this role view an adminOnly-type Alert") get evaluated against
 * the actual fetched entity.
 *
 * `projection` must be a flat plain object built by the caller from the
 * fields a Permission.conditions shape actually needs to match against
 * (e.g. `{ alertTypeAdminOnly: alert.alertType.adminOnly }`), NOT the raw
 * TypeORM entity - CASL's default matcher does plain equality/comparison
 * and won't reliably see through lazy relations on a live entity instance.
 *
 * Throws NotFoundException (404), not ForbiddenException (403): for a Tier
 * C record, a denial here must look identical to "this id doesn't exist" -
 * the same treatment the existing `where: { id, schoolId }` cross-tenant
 * lookup pattern already gives a foreign-tenant id - so an unauthorized
 * viewer can never distinguish "doesn't exist" from "exists but you can't
 * see it" for e.g. a Safeguarding-type alert.
 *
 * The cast below is the same documented, narrow boundary as
 * casl-ability.factory.ts's ConditionalCanBuilder: AppAbility's subject
 * slot is plain `string` (Foundation's free-text catalog design), which
 * can't compose with CASL's instance/conditions-checking overloads that
 * expect a closed literal subject union. `subject()`'s runtime behavior
 * (tagging a plain object with its subject type for the matcher to read)
 * is correct regardless of that static-typing gap, and is covered by
 * authorize.spec.ts.
 */
export function assertCan(
  ability: AppAbility,
  verb: string,
  subjectType: string,
  projection: Record<string, unknown>,
): void {
  try {
    const instance = subject(subjectType, projection) as unknown as string;
    ForbiddenError.from(ability).throwUnlessCan(verb, instance);
  } catch (error) {
    if (error instanceof ForbiddenError) {
      throw new NotFoundException();
    }
    throw error;
  }
}
