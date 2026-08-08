import { randomUUID } from 'node:crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { SchoolModule } from '../school/school.module';
import { PeopleModule } from '../people/people.module';
import { CurriculumModule } from './curriculum.module';
import { SchoolsRepository } from '../school/repositories/schools.repository';
import { SchoolYearsRepository } from '../school/repositories/school-years.repository';
import { CoursesService } from './courses.service';
import { CourseClassesService } from './course-classes.service';

describe('CourseClassesService (integration)', () => {
  let module: TestingModule;
  let schools: SchoolsRepository;
  let schoolYears: SchoolYearsRepository;
  let courses: CoursesService;
  let service: CourseClassesService;
  let createdSchoolIds: string[];

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        DatabaseModule,
        SchoolModule,
        PeopleModule,
        CurriculumModule,
      ],
    }).compile();

    schools = module.get(SchoolsRepository);
    schoolYears = module.get(SchoolYearsRepository);
    courses = module.get(CoursesService);
    service = module.get(CourseClassesService);
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

  async function createFixture() {
    const school = await schools.save(
      schools.create({ name: 'Test School', subdomainSlug: randomUUID() }),
    );
    createdSchoolIds.push(school.id);
    const schoolYear = await schoolYears.save(
      schoolYears.create({
        schoolId: school.id,
        name: '2026',
        sequenceNumber: 1,
      }),
    );
    const course = await courses.create(school.id, {
      schoolYearId: schoolYear.id,
      name: 'Mathematics',
      shortName: 'MATH',
    });
    return { school, course };
  }

  it('creates and lists a class scoped to its course', async () => {
    const { school, course } = await createFixture();

    await service.create(school.id, course.id, {
      name: 'Mathematics 7A',
      shortName: '7A',
    });

    const found = await service.list(school.id, course.id);
    expect(found.map((c) => c.name)).toEqual(['Mathematics 7A']);
    expect(found[0].reportable).toBe(true);
    expect(found[0].takesAttendance).toBe(true);
  });

  it('throws NotFound creating a class under a course from a different school', async () => {
    const { course } = await createFixture();
    const { school: otherSchool } = await createFixture();

    await expect(
      service.create(otherSchool.id, course.id, {
        name: 'Mathematics 7A',
        shortName: '7A',
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('rejects a duplicate (courseId, shortName) as a clean 409', async () => {
    const { school, course } = await createFixture();
    await service.create(school.id, course.id, {
      name: 'Mathematics 7A',
      shortName: '7A',
    });

    await expect(
      service.create(school.id, course.id, {
        name: 'Mathematics 7A (duplicate)',
        shortName: '7A',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('updates a class', async () => {
    const { school, course } = await createFixture();
    const courseClass = await service.create(school.id, course.id, {
      name: 'Mathematics 7A',
      shortName: '7A',
    });

    const updated = await service.update(school.id, courseClass.id, {
      takesAttendance: false,
    });

    expect(updated.takesAttendance).toBe(false);
  });

  it('throws NotFound updating a class belonging to a different school', async () => {
    const { school, course } = await createFixture();
    const { school: otherSchool } = await createFixture();
    const courseClass = await service.create(school.id, course.id, {
      name: 'Mathematics 7A',
      shortName: '7A',
    });

    await expect(
      service.update(otherSchool.id, courseClass.id, { name: 'Hijacked' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('soft-removes a class', async () => {
    const { school, course } = await createFixture();
    const courseClass = await service.create(school.id, course.id, {
      name: 'Mathematics 7A',
      shortName: '7A',
    });

    await service.remove(school.id, courseClass.id);

    expect(await service.list(school.id, course.id)).toHaveLength(0);
  });
});
