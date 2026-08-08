import { PartialType } from '@nestjs/mapped-types';
import { CreateFacilityBookingDto } from './create-facility-booking.dto';

export class UpdateFacilityBookingDto extends PartialType(
  CreateFacilityBookingDto,
) {}
