import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './current-user.decorator';
import type { AccessTokenPayload } from './access-token-payload';
import { CaslAbilityFactory } from '../rbac/casl-ability.factory';

@UseGuards(JwtAuthGuard)
@Controller('me')
export class MeController {
  constructor(private readonly abilityFactory: CaslAbilityFactory) {}

  /**
   * Direct replacement for Gibbon's isActionAccessible(), now centralized
   * instead of checked ad hoc per page - the Next.js app queries this at
   * login to drive menu visibility from one source of truth.
   */
  @Get('abilities')
  async abilities(@CurrentUser() user: AccessTokenPayload) {
    const ability = await this.abilityFactory.buildAbilityForRole(
      user.schoolId,
      user.activeRoleId,
    );
    return { rules: ability.rules };
  }
}
