import { Controller, Get, NotFoundException, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './current-user.decorator';
import type { AccessTokenPayload } from './access-token-payload';
import { CaslAbilityFactory } from '../rbac/casl-ability.factory';
import { SchoolYearsRepository } from '../school/repositories/school-years.repository';

@UseGuards(JwtAuthGuard)
@Controller('me')
export class MeController {
  constructor(
    private readonly abilityFactory: CaslAbilityFactory,
    private readonly schoolYears: SchoolYearsRepository,
  ) {}

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

  /**
   * Tier 2 (M25): a genuine pre-existing gap this frontend slice surfaced -
   * `SchoolYearsRepository.findCurrentForSchool()` existed since Foundation
   * but was never reachable over HTTP at all. Self-scoped (no CheckPolicies)
   * like `abilities` above: "what's the current school year" isn't
   * sensitive, and every Tier 2 page (Timetable/Attendance/Calendar) needs
   * it to build its own date-range/form-group queries.
   */
  @Get('current-school-year')
  async currentSchoolYear(@CurrentUser() user: AccessTokenPayload) {
    const schoolYear = await this.schoolYears.findCurrentForSchool(
      user.schoolId,
    );
    if (!schoolYear) {
      throw new NotFoundException(
        'No current school year is set for this school',
      );
    }
    return schoolYear;
  }
}
