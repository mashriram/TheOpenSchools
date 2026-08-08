import { randomUUID } from 'node:crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { SchoolModule } from '../school/school.module';
import { PeopleModule } from '../people/people.module';
import { CurriculumModule } from '../curriculum/curriculum.module';
import { MarkbookModule } from './markbook.module';
import { SchoolsRepository } from '../school/repositories/schools.repository';
import { SchoolYearsRepository } from '../school/repositories/school-years.repository';
import { CoursesService } from '../curriculum/courses.service';
import { CourseClassesService } from '../curriculum/course-classes.service';
import { ScalesService } from './scales.service';
import { MarkbookColumnsService } from './markbook-columns.service';

describe('MarkbookColumnsService (integration)', () => {
  let module: TestingModule;
  let schools: SchoolsRepository;
  let schoolYears: SchoolYearsRepository;
  let courses: CoursesService;
  let courseClasses: CourseClassesService;
  let scales: ScalesService;
  let service: MarkbookColumnsService;
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
    scales = module.get(ScalesService);
    service = module.get(MarkbookColumnsService);
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
    const scale = await scales.create(school.id, {
      name: 'Attainment Scale',
      shortName: 'ATT',
    });
    return { school, courseClass, scale };
  }

  it('creates a column scoped to a course class', async () => {
    const { school, courseClass, scale } = await setUp();

    const column = await service.create(school.id, courseClass.id, {
      name: 'Term 1 Test',
      scaleIdAttainment: scale.id,
    });

    expect(column.viewableStudents).toBe(false);
    expect(await service.list(school.id, courseClass.id)).toHaveLength(1);
  });

  it('rejects a scaleIdAttainment from a different school with 400', async () => {
    const { school, courseClass } = await setUp();
    const other = await setUp();

    await expect(
      service.create(school.id, courseClass.id, {
        name: 'Term 1 Test',
        scaleIdAttainment: other.scale.id,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws NotFound updating a column belonging to a different school', async () => {
    const { school, courseClass } = await setUp();
    const other = await setUp();
    const column = await service.create(school.id, courseClass.id, {
      name: 'Term 1 Test',
    });

    await expect(
      service.update(other.school.id, column.id, { name: 'Hijacked' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('soft-removes a column', async () => {
    const { school, courseClass } = await setUp();
    const column = await service.create(school.id, courseClass.id, {
      name: 'Term 1 Test',
    });

    await service.remove(school.id, column.id);

    expect(await service.list(school.id, courseClass.id)).toHaveLength(0);
  });
});
