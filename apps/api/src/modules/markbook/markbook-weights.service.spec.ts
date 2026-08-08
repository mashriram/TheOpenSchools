import { randomUUID } from 'node:crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { SchoolModule } from '../school/school.module';
import { PeopleModule } from '../people/people.module';
import { CurriculumModule } from '../curriculum/curriculum.module';
import { MarkbookModule } from './markbook.module';
import { SchoolsRepository } from '../school/repositories/schools.repository';
import { SchoolYearsRepository } from '../school/repositories/school-years.repository';
import { CoursesService } from '../curriculum/courses.service';
import { CourseClassesService } from '../curriculum/course-classes.service';
import { MarkbookWeightsService } from './markbook-weights.service';

describe('MarkbookWeightsService (integration)', () => {
  let module: TestingModule;
  let schools: SchoolsRepository;
  let schoolYears: SchoolYearsRepository;
  let courses: CoursesService;
  let courseClasses: CourseClassesService;
  let service: MarkbookWeightsService;
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
    courses = module.get(CoursesService);
    courseClasses = module.get(CourseClassesService);
    service = module.get(MarkbookWeightsService);
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
    return { school, courseClass };
  }

  it('creates a weighting category for a class', async () => {
    const { school, courseClass } = await setUp();

    const weight = await service.create(school.id, courseClass.id, {
      name: 'Exams',
      weighting: 60,
    });

    expect(weight.weighting).toBe(60);
    expect(await service.list(school.id, courseClass.id)).toHaveLength(1);
  });

  it('rejects a duplicate weighting name within the same class as a clean 409', async () => {
    const { school, courseClass } = await setUp();
    await service.create(school.id, courseClass.id, {
      name: 'Exams',
      weighting: 60,
    });

    await expect(
      service.create(school.id, courseClass.id, {
        name: 'Exams',
        weighting: 40,
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('throws NotFound removing a weighting belonging to a different school', async () => {
    const { school, courseClass } = await setUp();
    const other = await setUp();
    const weight = await service.create(school.id, courseClass.id, {
      name: 'Exams',
      weighting: 60,
    });

    await expect(service.remove(other.school.id, weight.id)).rejects.toThrow(
      NotFoundException,
    );
  });
});
