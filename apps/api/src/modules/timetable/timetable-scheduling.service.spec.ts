import { randomUUID } from 'node:crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { SchoolModule } from '../school/school.module';
import { PeopleModule } from '../people/people.module';
import { CurriculumModule } from '../curriculum/curriculum.module';
import { TimetableModule } from './timetable.module';
import { SchoolsRepository } from '../school/repositories/schools.repository';
import { SchoolYearsRepository } from '../school/repositories/school-years.repository';
import { CoursesService } from '../curriculum/courses.service';
import { CourseClassesService } from '../curriculum/course-classes.service';
import { TimetableColumnsService } from './timetable-columns.service';
import { TimetablesService } from './timetables.service';
import { TimetableDaysService } from './timetable-days.service';
import { TimetableSchedulingService } from './timetable-scheduling.service';

describe('TimetableSchedulingService (integration)', () => {
  let module: TestingModule;
  let schools: SchoolsRepository;
  let schoolYears: SchoolYearsRepository;
  let courses: CoursesService;
  let courseClasses: CourseClassesService;
  let columns: TimetableColumnsService;
  let timetables: TimetablesService;
  let days: TimetableDaysService;
  let service: TimetableSchedulingService;
  let createdSchoolIds: string[];

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        DatabaseModule,
        SchoolModule,
        PeopleModule,
        CurriculumModule,
        TimetableModule,
      ],
    }).compile();

    schools = module.get(SchoolsRepository);
    schoolYears = module.get(SchoolYearsRepository);
    courses = module.get(CoursesService);
    courseClasses = module.get(CourseClassesService);
    columns = module.get(TimetableColumnsService);
    timetables = module.get(TimetablesService);
    days = module.get(TimetableDaysService);
    service = module.get(TimetableSchedulingService);
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

  async function setUp() {
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
    const course = await courses.create(school.id, {
      schoolYearId: schoolYear.id,
      name: 'Maths',
      shortName: 'MATH',
    });
    const courseClass = await courseClasses.create(school.id, course.id, {
      name: 'Maths 7A',
      shortName: 'M7A',
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
    return { school, courseClass, row, day };
  }

  it('schedules a class into a period/day slot', async () => {
    const { school, courseClass, row, day } = await setUp();

    const scheduled = await service.scheduleClass(school.id, {
      timetableColumnRowId: row.id,
      timetableDayId: day.id,
      courseClassId: courseClass.id,
    });

    expect(scheduled.courseClassId).toBe(courseClass.id);
  });

  it('rejects double-scheduling the same class into the same row/day slot as a clean 409', async () => {
    const { school, courseClass, row, day } = await setUp();
    await service.scheduleClass(school.id, {
      timetableColumnRowId: row.id,
      timetableDayId: day.id,
      courseClassId: courseClass.id,
    });

    await expect(
      service.scheduleClass(school.id, {
        timetableColumnRowId: row.id,
        timetableDayId: day.id,
        courseClassId: courseClass.id,
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('rejects scheduling with a courseClassId from a different school', async () => {
    const { school, row, day } = await setUp();
    const other = await setUp();

    await expect(
      service.scheduleClass(school.id, {
        timetableColumnRowId: row.id,
        timetableDayId: day.id,
        courseClassId: other.courseClass.id,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('unschedules a class', async () => {
    const { school, courseClass, row, day } = await setUp();
    const scheduled = await service.scheduleClass(school.id, {
      timetableColumnRowId: row.id,
      timetableDayId: day.id,
      courseClassId: courseClass.id,
    });

    await service.unscheduleClass(school.id, scheduled.id);

    await expect(
      service.updateSpace(school.id, scheduled.id, {}),
    ).rejects.toThrow(NotFoundException);
  });
});
