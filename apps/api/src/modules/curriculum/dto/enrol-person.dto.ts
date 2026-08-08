import { IsIn, IsUUID } from 'class-validator';
import type { CourseClassPersonRole } from '../entities/course-class-person.entity';

export const COURSE_CLASS_PERSON_ROLES: CourseClassPersonRole[] = [
  'Student',
  'Teacher',
  'Assistant',
  'Technician',
  'Parent',
];

export class EnrolPersonDto {
  @IsUUID('4')
  personId: string;

  @IsIn(COURSE_CLASS_PERSON_ROLES)
  role: CourseClassPersonRole;
}
