import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AppAbility } from './casl-ability.factory';

interface RequestWithAbility {
  ability?: AppAbility;
}

/**
 * Reuses the Ability PoliciesGuard already built for this request (mirrors
 * CurrentUser() exactly) rather than re-querying Permission/Action rows a
 * second time - needed by services doing a row-level check via assertCan()
 * after fetching a single record (see plan §Data Safety Design B). Only
 * populated on routes guarded by PoliciesGuard with at least one
 * @CheckPolicies() handler; every route that needs row-level checks always
 * has one for its coarse pre-check, so this is never undefined in practice
 * for those call sites.
 */
export const CurrentAbility = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AppAbility | undefined => {
    const request = context.switchToHttp().getRequest<RequestWithAbility>();
    return request.ability;
  },
);
