import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AccessTokenPayload } from '../auth/access-token-payload';
import { PoliciesGuard } from '../rbac/policies.guard';
import { CheckPolicies } from '../rbac/check-policies.decorator';
import { GdprService } from './gdpr.service';
import { RecordConsentDto } from './dto/record-consent.dto';

@UseGuards(JwtAuthGuard)
@Controller('gdpr')
export class GdprController {
  constructor(private readonly gdpr: GdprService) {}

  @Get('export/me')
  exportSelf(@CurrentUser() user: AccessTokenPayload) {
    return this.gdpr.exportPerson(user.schoolId, user.sub);
  }

  @Get('export/:personId')
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can('export', 'Person'))
  exportOnBehalfOf(
    @CurrentUser() user: AccessTokenPayload,
    @Param('personId', ParseUUIDPipe) personId: string,
  ) {
    return this.gdpr.exportPerson(user.schoolId, personId);
  }

  @Post('erasure-request/me')
  @HttpCode(204)
  requestSelfErasure(@CurrentUser() user: AccessTokenPayload) {
    return this.gdpr.requestErasure(user.schoolId, user.sub);
  }

  @Post('erasure-request/:personId')
  @HttpCode(204)
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can('erase', 'Person'))
  requestErasureOnBehalfOf(
    @CurrentUser() user: AccessTokenPayload,
    @Param('personId', ParseUUIDPipe) personId: string,
  ) {
    return this.gdpr.requestErasure(user.schoolId, personId);
  }

  @Post('consent')
  recordOwnConsent(
    @CurrentUser() user: AccessTokenPayload,
    @Body() dto: RecordConsentDto,
  ) {
    return this.gdpr.recordConsent(user.sub, dto.policyVersion);
  }
}
