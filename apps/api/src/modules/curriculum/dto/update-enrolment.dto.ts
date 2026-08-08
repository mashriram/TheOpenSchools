import { IsBoolean, IsIn, IsOptional } from 'class-validator';
import type { CourseClassPersonRole } from '../entities/course-class-person.entity';
import { COURSE_CLASS_PERSON_ROLES } from './enrol-person.dto';

// Deliberately excludes dateEnrolled/dateUnenrolled: those are only ever set
// by CourseEnrolmentService.enrol()/unenrol(), not by a generic edit form -
// stricter than Gibbon, whose edit form could set enrolment dates directly.
export class UpdateEnrolmentDto {
  @IsOptional()
  @IsIn(COURSE_CLASS_PERSON_ROLES)
  role?: CourseClassPersonRole;

  @IsOptional()
  @IsBoolean()
  reportable?: boolean;
}
