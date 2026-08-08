import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AppAbility, CaslAbilityFactory } from './casl-ability.factory';
import { CHECK_POLICIES_KEY, PolicyHandler } from './check-policies.decorator';
import type { AccessTokenPayload } from '../auth/access-token-payload';

interface RequestWithUser {
  user: AccessTokenPayload;
  ability?: AppAbility;
}

/**
 * Must run after JwtAuthGuard (which populates request.user) - order
 * matters in @UseGuards(JwtAuthGuard, PoliciesGuard).
 */
@Injectable()
export class PoliciesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly abilityFactory: CaslAbilityFactory,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const handlers =
      this.reflector.getAllAndOverride<PolicyHandler[]>(CHECK_POLICIES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    if (handlers.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const ability = await this.abilityFactory.buildAbilityForRole(
      request.user.schoolId,
      request.user.activeRoleId,
    );
    // Stashed so a service handling this same request can reuse it (via the
    // CurrentAbility() decorator) for a row-level check after fetching a
    // single record, instead of a second buildAbilityForRole DB round-trip.
    request.ability = ability;

    const allowed = handlers.every((handler) => handler(ability));
    if (!allowed) {
      throw new ForbiddenException(
        'You do not have permission to perform this action',
      );
    }

    return true;
  }
}
