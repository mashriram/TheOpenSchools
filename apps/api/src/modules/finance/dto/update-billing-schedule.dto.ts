import { PartialType } from '@nestjs/mapped-types';
import { CreateBillingScheduleDto } from './create-billing-schedule.dto';

export class UpdateBillingScheduleDto extends PartialType(
  CreateBillingScheduleDto,
) {}
