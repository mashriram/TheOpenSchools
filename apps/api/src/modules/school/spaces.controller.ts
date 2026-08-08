import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AccessTokenPayload } from '../auth/access-token-payload';
import { PoliciesGuard } from '../rbac/policies.guard';
import { CheckPolicies } from '../rbac/check-policies.decorator';
import { SpacesService } from './spaces.service';
import { CreateSpaceDto } from './dto/create-space.dto';
import { UpdateSpaceDto } from './dto/update-space.dto';

@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('school-admin/spaces')
export class SpacesController {
  constructor(private readonly spaces: SpacesService) {}

  @Get()
  @CheckPolicies((ability) => ability.can('manage', 'Space'))
  list(@CurrentUser() user: AccessTokenPayload) {
    return this.spaces.list(user.schoolId);
  }

  @Post()
  @CheckPolicies((ability) => ability.can('manage', 'Space'))
  create(@CurrentUser() user: AccessTokenPayload, @Body() dto: CreateSpaceDto) {
    return this.spaces.create(user.schoolId, dto);
  }

  @Patch(':id')
  @CheckPolicies((ability) => ability.can('manage', 'Space'))
  update(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSpaceDto,
  ) {
    return this.spaces.update(user.schoolId, id, dto);
  }

  @Delete(':id')
  @CheckPolicies((ability) => ability.can('manage', 'Space'))
  remove(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.spaces.remove(user.schoolId, id);
  }
}
