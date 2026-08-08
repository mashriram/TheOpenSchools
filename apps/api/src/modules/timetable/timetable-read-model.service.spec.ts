import { randomUUID } from 'node:crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { ForbiddenException } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { SchoolModule } from '../school/school.module';
import { PeopleModule } from '../people/people.module';
import { CurriculumModule } from '../curriculum/curriculum.module';
import { RbacModule } from '../rbac/rbac.module';
import { TimetableModule } from './timetable.module';
import { SchoolsRepository } from '../school/repositories/schools.repository';
import { SchoolYearsRepository } from '../school/repositories/school-years.repository';
import { RolesRepository } from '../rbac/repositories/roles.repository';
import { PeopleRepository } from '../people/repositories/people.repository';
import { FamiliesRepository } from '../people/repositories/families.repository';
import { FamilyAdultsRepository } from '../people/repositories/family-adults.repository';
import { FamilyChildrenRepository } from '../people/repositories/family-children.repository';
import { CoursesService } from '../curriculum/courses.service';
import { CourseClassesService } from '../curriculum/course-classes.service';
import { CourseEnrolmentService } from '../curriculum/course-enrolment.service';
import { TimetableColumnsService } from './timetable-columns.service';
import { TimetablesService } from './timetables.service';
import { TimetableDaysService } from './timetable-days.service';
import { TimetableSchedulingService } from './timetable-scheduling.service';
import { TimetableReadModelService } from './timetable-read-model.service';

describe('TimetableReadModelService (integration)', () => {
  let module: TestingModule;
  let schools: SchoolsRepository;
  let schoolYears: SchoolYearsRepository;
  let roles: RolesRepository;
  let people: PeopleRepository;
  let families: FamiliesRepository;
  let familyAdults: FamilyAdultsRepository;
  let familyChildren: FamilyChildrenRepository;
  let courses: CoursesService;
  let courseClasses: CourseClassesService;
  let enrolment: CourseEnrolmentService;
  let columns: TimetableColumnsService;
  let timetables: TimetablesService;
  let days: TimetableDaysService;
  let scheduling: TimetableSchedulingService;
  let service: TimetableReadModelService;
  let createdSchoolIds: string[];

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        DatabaseModule,
        SchoolModule,
        PeopleModule,
        CurriculumModule,
        RbacModule,
        TimetableModule,
      ],
    }).compile();

    schools = module.get(SchoolsRepository);
    schoolYears = module.get(SchoolYearsRepository);
    roles = module.get(RolesRepository);
    people = module.get(PeopleRepository);
    families = module.get(FamiliesRepository);
    familyAdults = module.get(FamilyAdultsRepository);
    familyChildren = module.get(FamilyChildrenRepository);
    courses = module.get(CoursesService);
    courseClasses = module.get(CourseClassesService);
    enrolment = module.get(CourseEnrolmentService);
    columns = module.get(TimetableColumnsService);
    timetables = module.get(TimetablesService);
    days = module.get(TimetableDaysService);
    scheduling = module.get(TimetableSchedulingService);
    service = module.get(TimetableReadModelService);
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(() => {
    createdSchoolIds = [];
  });

  afterEach(async () => {
    if (createdSchoolIds.length > 0) {
      await schools.delete(createdSchoolIds);
    }
  });

  /** Builds a fully scheduled class on 2026-09-03 (a Monday), with `student` enrolled. */
  async function setUpScheduledClass() {
    const school = await schools.save(
      schools.create({ name: 'Test School', subdomainSlug: randomUUID() }),
    );
    createdSchoolIds.push(school.id);
    const schoolYear = await schoolYears.save(
      schoolYears.create({
        schoolId: school.id,
        name: '2024-25',
        sequenceNumber: 1,
      }),
    );
    const student = await people.save(
      people.create({
        schoolId: school.id,
        surname: 'Student',
        firstName: 'Sam',
      }),
    );
    const course = await courses.create(school.id, {
      schoolYearId: schoolYear.id,
      name: 'Maths',
      shortName: 'MATH',
    });
    const courseClass = await courseClasses.create(school.id, course.id, {
      name: 'Maths 7A',
      shortName: 'M7A',
    });
    await enrolment.enrol(school.id, courseClass.id, {
      personId: student.id,
      role: 'Student',
    });
    const column = await columns.create(school.id, {
      name: 'Week A',
      shortName: 'WKA',
    });
    const row = await columns.addRow(school.id, column.id, {
      name: 'Period 1',
      shortName: 'P1',
      timeStart: '09:00',
      timeEnd: '09:50',
      type: 'Lesson',
    });
    const timetable = await timetables.create(school.id, {
      schoolYearId: schoolYear.id,
      name: 'Timetable',
      shortName: 'TT',
    });
    const day = await days.create(school.id, timetable.id, {
      timetableColumnId: column.id,
      name: 'Mon A',
      shortName: 'MA',
      color: '#ff0000',
      fontColor: '#ffffff',
    });
    await days.mapDate(school.id, day.id, '2026-09-03');
    await scheduling.scheduleClass(school.id, {
      timetableColumnRowId: row.id,
      timetableDayId: day.id,
      courseClassId: courseClass.id,
    });
    return { school, student, courseClass };
  }

  it('resolves the scheduled period for an enrolled student on the mapped date', async () => {
    const { school, student, courseClass } = await setUpScheduledClass();

    const schedule = await service.getScheduleForPerson(
      school.id,
      student.id,
      '2026-09-01',
      '2026-09-07',
    );

    expect(schedule).toEqual([
      expect.objectContaining({
        date: '2026-09-03',
        timeStart: '09:00:00',
        timeEnd: '09:50:00',
        courseClassId: courseClass.id,
      }),
    ]);
  });

  it('returns nothing for a date outside the day-date mapping', async () => {
    const { school, student } = await setUpScheduledClass();

    const schedule = await service.getScheduleForPerson(
      school.id,
      student.id,
      '2026-10-01',
      '2026-10-07',
    );

    expect(schedule).toEqual([]);
  });

  it('returns nothing for a person not enrolled in the scheduled class', async () => {
    const { school } = await setUpScheduledClass();
    const stranger = await people.save(
      people.create({
        schoolId: school.id,
        surname: 'Stranger',
        firstName: 'Sue',
      }),
    );

    const schedule = await service.getScheduleForPerson(
      school.id,
      stranger.id,
      '2026-09-01',
      '2026-09-07',
    );

    expect(schedule).toEqual([]);
  });

  describe('assertCanViewSchedule', () => {
    async function setUpRoleActor(
      schoolId: string,
      category: 'Staff' | 'Student' | 'Parent',
    ) {
      const role = await roles.save(
        roles.create({
          schoolId,
          category,
          name: randomUUID(),
          shortName: category.slice(0, 3),
          description: 'test role',
          restriction: 'None',
        }),
      );
      const person = await people.save(
        people.create({ schoolId, surname: category, firstName: 'Actor' }),
      );
      return { role, person };
    }

    it('always allows viewing your own schedule regardless of role', async () => {
      const { school, student } = await setUpScheduledClass();
      const { role } = await setUpRoleActor(school.id, 'Student');

      await expect(
        service.assertCanViewSchedule(student.id, role.id, student.id),
      ).resolves.toBeUndefined();
    });

    it('allows Staff to view any person’s schedule in the school', async () => {
      const { school, student } = await setUpScheduledClass();
      const { role, person: staff } = await setUpRoleActor(school.id, 'Staff');

      await expect(
        service.assertCanViewSchedule(staff.id, role.id, student.id),
      ).resolves.toBeUndefined();
    });

    it('forbids a Student from viewing anyone else’s schedule', async () => {
      const { school, student } = await setUpScheduledClass();
      const { role, person: otherStudent } = await setUpRoleActor(
        school.id,
        'Student',
      );

      await expect(
        service.assertCanViewSchedule(otherStudent.id, role.id, student.id),
      ).rejects.toThrow(ForbiddenException);
    });

    it('allows a Parent with childDataAccess to view their child’s schedule', async () => {
      const { school, student } = await setUpScheduledClass();
      const { role, person: parent } = await setUpRoleActor(
        school.id,
        'Parent',
      );
      const family = await families.save(
        families.create({ schoolId: school.id, name: 'The Family' }),
      );
      await familyAdults.save(
        familyAdults.create({
          familyId: family.id,
          personId: parent.id,
          childDataAccess: true,
        }),
      );
      await familyChildren.save(
        familyChildren.create({ familyId: family.id, personId: student.id }),
      );

      await expect(
        service.assertCanViewSchedule(parent.id, role.id, student.id),
      ).resolves.toBeUndefined();
    });

    it('forbids a Parent without childDataAccess from viewing the child’s schedule', async () => {
      const { school, student } = await setUpScheduledClass();
      const { role, person: parent } = await setUpRoleActor(
        school.id,
        'Parent',
      );
      const family = await families.save(
        families.create({ schoolId: school.id, name: 'The Family' }),
      );
      await familyAdults.save(
        familyAdults.create({
          familyId: family.id,
          personId: parent.id,
          childDataAccess: false,
        }),
      );
      await familyChildren.save(
        familyChildren.create({ familyId: family.id, personId: student.id }),
      );

      await expect(
        service.assertCanViewSchedule(parent.id, role.id, student.id),
      ).rejects.toThrow(ForbiddenException);
    });

    it('forbids a Parent from viewing an unrelated child’s schedule', async () => {
      const { school, student } = await setUpScheduledClass();
      const { role, person: parent } = await setUpRoleActor(
        school.id,
        'Parent',
      );

      await expect(
        service.assertCanViewSchedule(parent.id, role.id, student.id),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
