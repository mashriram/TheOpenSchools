import { randomUUID } from 'node:crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { SchoolModule } from '../school/school.module';
import { PeopleModule } from '../people/people.module';
import { CurriculumModule } from '../curriculum/curriculum.module';
import { MarkbookModule } from './markbook.module';
import { SchoolsRepository } from '../school/repositories/schools.repository';
import { SchoolYearsRepository } from '../school/repositories/school-years.repository';
import { PeopleRepository } from '../people/repositories/people.repository';
import { CoursesService } from '../curriculum/courses.service';
import { CourseClassesService } from '../curriculum/course-classes.service';
import { ScalesService } from './scales.service';
import { ScaleGradesService } from './scale-grades.service';
import { MarkbookTargetsService } from './markbook-targets.service';

describe('MarkbookTargetsService (integration)', () => {
  let module: TestingModule;
  let schools: SchoolsRepository;
  let schoolYears: SchoolYearsRepository;
  let people: PeopleRepository;
  let courses: CoursesService;
  let courseClasses: CourseClassesService;
  let scales: ScalesService;
  let scaleGrades: ScaleGradesService;
  let service: MarkbookTargetsService;
  let createdSchoolIds: string[];

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        DatabaseModule,
        SchoolModule,
        PeopleModule,
        CurriculumModule,
        MarkbookModule,
      ],
    }).compile();

    schools = module.get(SchoolsRepository);
    schoolYears = module.get(SchoolYearsRepository);
    people = module.get(PeopleRepository);
    courses = module.get(CoursesService);
    courseClasses = module.get(CourseClassesService);
    scales = module.get(ScalesService);
    scaleGrades = module.get(ScaleGradesService);
    service = module.get(MarkbookTargetsService);
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
    const scale = await scales.create(school.id, {
      name: 'Scale',
      shortName: 'SC',
    });
    const grade = await scaleGrades.create(school.id, scale.id, {
      name: 'C',
      shortName: 'C',
      value: 3,
    });
    return { school, student, courseClass, grade };
  }

  it('creates a personal target for a student in a class', async () => {
    const { school, student, courseClass, grade } = await setUp();

    const target = await service.create(school.id, courseClass.id, {
      personId: student.id,
      targetScaleGradeId: grade.id,
    });

    expect(target.targetScaleGradeId).toBe(grade.id);
  });

  it('rejects a second target for the same student/class as a clean 409', async () => {
    const { school, student, courseClass, grade } = await setUp();
    await service.create(school.id, courseClass.id, {
      personId: student.id,
      targetScaleGradeId: grade.id,
    });

    await expect(
      service.create(school.id, courseClass.id, {
        personId: student.id,
        targetScaleGradeId: grade.id,
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('rejects a personId from a different school with 400', async () => {
    const { school, courseClass, grade } = await setUp();
    const other = await setUp();

    await expect(
      service.create(school.id, courseClass.id, {
        personId: other.student.id,
        targetScaleGradeId: grade.id,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('hard-removes a target', async () => {
    const { school, student, courseClass, grade } = await setUp();
    const target = await service.create(school.id, courseClass.id, {
      personId: student.id,
      targetScaleGradeId: grade.id,
    });

    await service.remove(school.id, target.id);

    expect(await service.list(school.id, courseClass.id)).toHaveLength(0);
  });
});
