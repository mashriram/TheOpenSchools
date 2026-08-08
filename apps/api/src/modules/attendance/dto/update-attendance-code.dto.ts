import { PartialType } from '@nestjs/mapped-types';
import { CreateAttendanceCodeDto } from './create-attendance-code.dto';

export class UpdateAttendanceCodeDto extends PartialType(
  CreateAttendanceCodeDto,
) {}
