import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateStudentEnrolmentDto } from './create-student-enrolment.dto';

// schoolYearId is deliberately excluded: moving a StudentEnrolment to a
// different SchoolYear is not a supported update - create a new enrolment.
export class UpdateStudentEnrolmentDto extends PartialType(
  OmitType(CreateStudentEnrolmentDto, ['schoolYearId']),
) {}
