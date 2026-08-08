import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateCourseDto } from './create-course.dto';

// schoolYearId is deliberately excluded: moving a Course to a different
// SchoolYear (possibly belonging to a different School) is not a supported
// update - create a new Course instead. Matches UpdateFormGroupDto's
// precedent for the same reasoning.
export class UpdateCourseDto extends PartialType(
  OmitType(CreateCourseDto, ['schoolYearId']),
) {}
