import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AttendanceLogPeopleRepository } from './repositories/attendance-log-people.repository';
import { AttendanceLogFormGroupsRepository } from './repositories/attendance-log-form-groups.repository';
import { AttendanceLogCourseClassesRepository } from './repositories/attendance-log-course-classes.repository';
import { AttendanceCodesService } from './attendance-codes.service';
import { FormGroupsRepository } from '../school/repositories/form-groups.repository';
import { CourseClassesRepository } from '../curriculum/repositories/course-classes.repository';
import { StudentEnrolmentsRepository } from '../people/repositories/student-enrolments.repository';
import { CourseClassPeopleRepository } from '../curriculum/repositories/course-class-people.repository';
import { FormGroup } from '../school/entities/form-group.entity';
import { CourseClass } from '../curriculum/entities/course-class.entity';
import { AttendanceLogPerson } from './entities/attendance-log-person.entity';
import { RecordRegisterDto } from './dto/record-register.dto';

export interface RegisterActor {
  personId: string;
  activeRoleId: string;
}

/**
 * Reproduces Gibbon's real per-code role restriction (formerly a CSV column,
 * now the AttendanceCodeRole join table - see that entity's doc comment):
 * an empty restriction list means the code is unrestricted, a non-empty one
 * means only the listed roles may record it.
 */
@Injectable()
export class AttendanceRegisterService {
  constructor(
    private readonly logPeople: AttendanceLogPeopleRepository,
    private readonly logFormGroups: AttendanceLogFormGroupsRepository,
    private readonly logCourseClasses: AttendanceLogCourseClassesRepository,
    private readonly codes: AttendanceCodesService,
    private readonly formGroups: FormGroupsRepository,
    private readonly courseClasses: CourseClassesRepository,
    private readonly studentEnrolments: StudentEnrolmentsRepository,
    private readonly courseClassPeople: CourseClassPeopleRepository,
  ) {}

  async recordForFormGroup(
    schoolId: string,
    formGroupId: string,
    actor: RegisterActor,
    dto: RecordRegisterDto,
  ): Promise<AttendanceLogPerson[]> {
    await this.getOwnedFormGroup(schoolId, formGroupId);

    const results: AttendanceLogPerson[] = [];
    for (const entry of dto.entries) {
      const code = await this.assertCodeUsable(
        schoolId,
        entry.attendanceCodeId,
        actor.activeRoleId,
      );
      const enrolment = await this.studentEnrolments.findByPersonAndFormGroup(
        entry.personId,
        formGroupId,
      );
      if (!enrolment) {
        throw new BadRequestException(
          `personId ${entry.personId} is not enrolled in this form group`,
        );
      }

      const existing = await this.logPeople.findByPersonFormGroupAndDate(
        entry.personId,
        formGroupId,
        dto.date,
      );
      const row =
        existing ??
        this.logPeople.create({
          personId: entry.personId,
          formGroupId,
          date: dto.date,
          context: 'Form Group',
        });
      row.attendanceCodeId = code.id;
      row.direction = code.direction;
      row.reason = entry.reason ?? null;
      row.comment = entry.comment ?? null;
      row.takenByPersonId = actor.personId;
      row.takenAt = new Date();
      results.push(await this.logPeople.save(row));
    }

    await this.upsertFormGroupMarker(formGroupId, dto.date, actor.personId);
    return results;
  }

  async recordForCourseClass(
    schoolId: string,
    courseClassId: string,
    actor: RegisterActor,
    dto: RecordRegisterDto,
  ): Promise<AttendanceLogPerson[]> {
    await this.getOwnedCourseClass(schoolId, courseClassId);

    const results: AttendanceLogPerson[] = [];
    for (const entry of dto.entries) {
      const code = await this.assertCodeUsable(
        schoolId,
        entry.attendanceCodeId,
        actor.activeRoleId,
      );
      const enrolment = await this.courseClassPeople.findByClassAndPerson(
        courseClassId,
        entry.personId,
      );
      if (!enrolment) {
        throw new BadRequestException(
          `personId ${entry.personId} is not enrolled in this class`,
        );
      }

      const existing = await this.logPeople.findByPersonCourseClassAndDate(
        entry.personId,
        courseClassId,
        dto.date,
      );
      const row =
        existing ??
        this.logPeople.create({
          personId: entry.personId,
          courseClassId,
          date: dto.date,
          context: 'Class',
        });
      row.attendanceCodeId = code.id;
      row.direction = code.direction;
      row.reason = entry.reason ?? null;
      row.comment = entry.comment ?? null;
      row.takenByPersonId = actor.personId;
      row.takenAt = new Date();
      results.push(await this.logPeople.save(row));
    }

    await this.upsertCourseClassMarker(courseClassId, dto.date, actor.personId);
    return results;
  }

  listForPerson(
    personId: string,
    dateStart: string,
    dateEnd: string,
  ): Promise<AttendanceLogPerson[]> {
    return this.logPeople.findByPersonAndDateRange(
      personId,
      dateStart,
      dateEnd,
    );
  }

  private async assertCodeUsable(
    schoolId: string,
    attendanceCodeId: string,
    activeRoleId: string,
  ) {
    const code = await this.codes.getOwned(schoolId, attendanceCodeId);
    const restrictedRoleIds = await this.codes.listRestrictedRoleIds(code.id);
    if (
      restrictedRoleIds.length > 0 &&
      !restrictedRoleIds.includes(activeRoleId)
    ) {
      throw new ForbiddenException(
        'Your role is not permitted to record this attendance code',
      );
    }
    return code;
  }

  private async getOwnedFormGroup(
    schoolId: string,
    formGroupId: string,
  ): Promise<FormGroup> {
    const formGroup = await this.formGroups.findByIdWithSchoolYear(formGroupId);
    if (!formGroup || formGroup.schoolYear.schoolId !== schoolId) {
      throw new NotFoundException('Form group not found');
    }
    return formGroup;
  }

  private async getOwnedCourseClass(
    schoolId: string,
    courseClassId: string,
  ): Promise<CourseClass> {
    const courseClass = await this.courseClasses.findByIdAndSchool(
      courseClassId,
      schoolId,
    );
    if (!courseClass) {
      throw new NotFoundException('Course class not found');
    }
    return courseClass;
  }

  private async upsertFormGroupMarker(
    formGroupId: string,
    date: string,
    takenByPersonId: string,
  ): Promise<void> {
    const existing = await this.logFormGroups.findByFormGroupAndDate(
      formGroupId,
      date,
    );
    const marker = existing ?? this.logFormGroups.create({ formGroupId, date });
    marker.takenByPersonId = takenByPersonId;
    marker.takenAt = new Date();
    await this.logFormGroups.save(marker);
  }

  private async upsertCourseClassMarker(
    courseClassId: string,
    date: string,
    takenByPersonId: string,
  ): Promise<void> {
    const existing = await this.logCourseClasses.findByCourseClassAndDate(
      courseClassId,
      date,
    );
    const marker =
      existing ?? this.logCourseClasses.create({ courseClassId, date });
    marker.takenByPersonId = takenByPersonId;
    marker.takenAt = new Date();
    await this.logCourseClasses.save(marker);
  }
}
