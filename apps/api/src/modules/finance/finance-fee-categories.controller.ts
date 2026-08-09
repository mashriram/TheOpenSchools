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
import { FinanceFeeCategoriesService } from './finance-fee-categories.service';
import { CreateFeeCategoryDto } from './dto/create-fee-category.dto';
import { UpdateFeeCategoryDto } from './dto/update-fee-category.dto';

@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('finance/fee-categories')
export class FinanceFeeCategoriesController {
  constructor(private readonly categories: FinanceFeeCategoriesService) {}

  @Get()
  @CheckPolicies((ability) => ability.can('manage', 'FinanceFeeCategory'))
  list(@CurrentUser() user: AccessTokenPayload) {
    return this.categories.list(user.schoolId);
  }

  @Post()
  @CheckPolicies((ability) => ability.can('manage', 'FinanceFeeCategory'))
  create(
    @CurrentUser() user: AccessTokenPayload,
    @Body() dto: CreateFeeCategoryDto,
  ) {
    return this.categories.create(user.schoolId, dto);
  }

  @Patch(':id')
  @CheckPolicies((ability) => ability.can('manage', 'FinanceFeeCategory'))
  update(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFeeCategoryDto,
  ) {
    return this.categories.update(user.schoolId, id, dto);
  }

  @Delete(':id')
  @CheckPolicies((ability) => ability.can('manage', 'FinanceFeeCategory'))
  remove(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.categories.remove(user.schoolId, id);
  }
}
