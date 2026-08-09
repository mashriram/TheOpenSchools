import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateBehaviourDto } from './create-behaviour.dto';

// schoolYearId/personId excluded: moving a Behaviour record to a different
// student/year is not a supported update - create a new record instead,
// matching UpdateCourseDto/UpdateEnrolmentDto's precedent.
export class UpdateBehaviourDto extends PartialType(
  OmitType(CreateBehaviourDto, ['schoolYearId', 'personId']),
) {}
