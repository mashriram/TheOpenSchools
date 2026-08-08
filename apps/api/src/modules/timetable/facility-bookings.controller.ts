import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AccessTokenPayload } from '../auth/access-token-payload';
import { PoliciesGuard } from '../rbac/policies.guard';
import { CheckPolicies } from '../rbac/check-policies.decorator';
import { FacilityBookingsService } from './facility-bookings.service';
import { CreateFacilityBookingDto } from './dto/create-facility-booking.dto';
import { UpdateFacilityBookingDto } from './dto/update-facility-booking.dto';

@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('timetable-admin/facility-bookings')
export class FacilityBookingsController {
  constructor(private readonly bookings: FacilityBookingsService) {}

  @Get()
  @CheckPolicies((ability) => ability.can('manage', 'FacilityBooking'))
  list(
    @CurrentUser() user: AccessTokenPayload,
    @Query('dateStart') dateStart: string,
    @Query('dateEnd') dateEnd: string,
  ) {
    return this.bookings.list(user.schoolId, dateStart, dateEnd);
  }

  @Post()
  @CheckPolicies((ability) => ability.can('manage', 'FacilityBooking'))
  create(
    @CurrentUser() user: AccessTokenPayload,
    @Body() dto: CreateFacilityBookingDto,
  ) {
    return this.bookings.create(user.schoolId, dto);
  }

  @Patch(':id')
  @CheckPolicies((ability) => ability.can('manage', 'FacilityBooking'))
  update(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFacilityBookingDto,
  ) {
    return this.bookings.update(user.schoolId, id, dto);
  }

  @Delete(':id')
  @CheckPolicies((ability) => ability.can('manage', 'FacilityBooking'))
  remove(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.bookings.remove(user.schoolId, id);
  }
}
