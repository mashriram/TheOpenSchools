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
import { HousesService } from './houses.service';
import { CreateHouseDto } from './dto/create-house.dto';
import { UpdateHouseDto } from './dto/update-house.dto';

@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('school-admin/houses')
export class HousesController {
  constructor(private readonly houses: HousesService) {}

  @Get()
  @CheckPolicies((ability) => ability.can('manage', 'House'))
  list(@CurrentUser() user: AccessTokenPayload) {
    return this.houses.list(user.schoolId);
  }

  @Post()
  @CheckPolicies((ability) => ability.can('manage', 'House'))
  create(@CurrentUser() user: AccessTokenPayload, @Body() dto: CreateHouseDto) {
    return this.houses.create(user.schoolId, dto);
  }

  @Patch(':id')
  @CheckPolicies((ability) => ability.can('manage', 'House'))
  update(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateHouseDto,
  ) {
    return this.houses.update(user.schoolId, id, dto);
  }

  @Delete(':id')
  @CheckPolicies((ability) => ability.can('manage', 'House'))
  remove(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.houses.remove(user.schoolId, id);
  }
}
