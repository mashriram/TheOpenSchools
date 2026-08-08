import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateFormGroupDto } from './create-form-group.dto';

// schoolYearId is deliberately excluded: moving a FormGroup to a different
// SchoolYear (possibly belonging to a different School) is not a supported
// update - create a new FormGroup instead.
export class UpdateFormGroupDto extends PartialType(
  OmitType(CreateFormGroupDto, ['schoolYearId']),
) {}
