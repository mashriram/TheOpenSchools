import { ForbiddenException, Injectable } from '@nestjs/common';
import { In } from 'typeorm';
import { TimetablesRepository } from './repositories/timetables.repository';
import { TimetableDayDatesRepository } from './repositories/timetable-day-dates.repository';
import { TimetableDayRowClassesRepository } from './repositories/timetable-day-row-classes.repository';
import { CourseClassPeopleRepository } from '../curriculum/repositories/course-class-people.repository';
import { RolesRepository } from '../rbac/repositories/roles.repository';
import { FamilyAdultsRepository } from '../people/repositories/family-adults.repository';
import { FamilyChildrenRepository } from '../people/repositories/family-children.repository';

export interface ScheduledPeriod {
  date: string;
  timeStart: string;
  timeEnd: string;
  courseClassId: string;
  courseClassName: string;
  spaceId: string | null;
  spaceName: string | null;
}

/**
 * The server-side equivalent of Gibbon's UI "Layers" composition (see plan
 * §M15) - resolves the timetabled periods a person is actually enrolled in
 * over a date range, as one composed read-model rather than a client-side
 * layer-rendering framework.
 */
@Injectable()
export class TimetableReadModelService {
  constructor(
    private readonly timetables: TimetablesRepository,
    private readonly dayDates: TimetableDayDatesRepository,
    private readonly dayRowClasses: TimetableDayRowClassesRepository,
    private readonly courseClassPeople: CourseClassPeopleRepository,
    private readonly roles: RolesRepository,
    private readonly familyAdults: FamilyAdultsRepository,
    private readonly familyChildren: FamilyChildrenRepository,
  ) {}

  /**
   * Enforces that `timetable.schedule.view`'s broad grant (Admin/Teacher/
   * Student/Parent/Support all get it by default, per Gibbon's real
   * defaults) never lets an authenticated caller pass an arbitrary
   * `personId` and see anyone's schedule: Staff/Other may query any person
   * in the school; a Student may only query their own; a Parent may query
   * their own or a child they have `childDataAccess` for (mirrors the same
   * check Gibbon's real `View Timetable by Person_myChildren` action makes
   * via `gibbonFamilyAdult.childDataAccess`).
   */
  async assertCanViewSchedule(
    callerPersonId: string,
    activeRoleId: string,
    targetPersonId: string,
  ): Promise<void> {
    if (callerPersonId === targetPersonId) {
      return;
    }
    const role = await this.roles.findOne({ where: { id: activeRoleId } });
    if (role?.category === 'Staff' || role?.category === 'Other') {
      return;
    }
    if (role?.category === 'Parent') {
      const accessibleFamilyIds = (
        await this.familyAdults.find({
          where: { personId: callerPersonId, childDataAccess: true },
        })
      ).map((adult) => adult.familyId);
      if (accessibleFamilyIds.length > 0) {
        const child = await this.familyChildren.findOne({
          where: {
            personId: targetPersonId,
            familyId: In(accessibleFamilyIds),
          },
        });
        if (child) {
          return;
        }
      }
    }
    throw new ForbiddenException(
      'You do not have access to view this schedule',
    );
  }

  async getScheduleForPerson(
    schoolId: string,
    personId: string,
    dateStart: string,
    dateEnd: string,
  ): Promise<ScheduledPeriod[]> {
    const activeTimetables = await this.timetables.findActiveBySchool(schoolId);

    const dayDatesByDayId = new Map<string, string[]>();
    for (const timetable of activeTimetables) {
      const mappings = await this.dayDates.findByTimetableAndDateRange(
        timetable.id,
        dateStart,
        dateEnd,
      );
      for (const mapping of mappings) {
        const dates = dayDatesByDayId.get(mapping.timetableDayId) ?? [];
        dates.push(mapping.date);
        dayDatesByDayId.set(mapping.timetableDayId, dates);
      }
    }

    const dayIds = [...dayDatesByDayId.keys()];
    const rowClasses = await this.dayRowClasses.findByDayIds(dayIds);

    // One enrolment lookup per distinct courseClassId, reused across every
    // date that class is scheduled on - CourseClassPerson is one row per
    // (courseClassId, personId), not one per historical date.
    const enrolmentByCourseClassId = new Map<
      string,
      Awaited<ReturnType<CourseClassPeopleRepository['findByClassAndPerson']>>
    >();
    for (const rowClass of rowClasses) {
      if (!enrolmentByCourseClassId.has(rowClass.courseClassId)) {
        const found = await this.courseClassPeople.findByClassAndPerson(
          rowClass.courseClassId,
          personId,
        );
        enrolmentByCourseClassId.set(rowClass.courseClassId, found);
      }
    }

    const result: ScheduledPeriod[] = [];
    for (const rowClass of rowClasses) {
      const enrolment = enrolmentByCourseClassId.get(rowClass.courseClassId);
      if (!enrolment) {
        continue;
      }
      const dates = dayDatesByDayId.get(rowClass.timetableDayId) ?? [];
      for (const date of dates) {
        if (!this.isEnrolledOnDate(enrolment, date)) {
          continue;
        }
        result.push({
          date,
          timeStart: rowClass.timetableColumnRow.timeStart,
          timeEnd: rowClass.timetableColumnRow.timeEnd,
          courseClassId: rowClass.courseClassId,
          courseClassName: rowClass.courseClass.name,
          spaceId: rowClass.spaceId,
          spaceName: rowClass.space?.name ?? null,
        });
      }
    }

    return result.sort(
      (a, b) =>
        a.date.localeCompare(b.date) || a.timeStart.localeCompare(b.timeStart),
    );
  }

  private isEnrolledOnDate(
    enrolment: { dateEnrolled: string | null; dateUnenrolled: string | null },
    date: string,
  ): boolean {
    if (enrolment.dateEnrolled && enrolment.dateEnrolled > date) {
      return false;
    }
    if (enrolment.dateUnenrolled && enrolment.dateUnenrolled < date) {
      return false;
    }
    return true;
  }
}
