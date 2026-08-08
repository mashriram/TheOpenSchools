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
import { CurriculumModule } from './curriculum.module';
import { SchoolsRepository } from '../school/repositories/schools.repository';
import { SchoolYearsRepository } from '../school/repositories/school-years.repository';
import { DepartmentsRepository } from '../school/repositories/departments.repository';
import { YearGroupsRepository } from '../school/repositories/year-groups.repository';
import { CoursesService } from './courses.service';
import { CourseYearGroupsRepository } from './repositories/course-year-groups.repository';

describe('CoursesService (integration)', () => {
  let module: TestingModule;
  let schools: SchoolsRepository;
  let schoolYears: SchoolYearsRepository;
  let departments: DepartmentsRepository;
  let yearGroups: YearGroupsRepository;
  let courseYearGroups: CourseYearGroupsRepository;
  let service: CoursesService;
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
    departments = module.get(DepartmentsRepository);
    yearGroups = module.get(YearGroupsRepository);
    courseYearGroups = module.get(CourseYearGroupsRepository);
    service = module.get(CoursesService);
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

  async function createSchoolWithYear() {
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
    return { school, schoolYear };
  }

  it('creates and lists a course scoped to its school and school year', async () => {
    const { school, schoolYear } = await createSchoolWithYear();
    const { schoolYear: otherYear } = await createSchoolWithYear();
    void otherYear;

    await service.create(school.id, {
      schoolYearId: schoolYear.id,
      name: 'Mathematics 7',
      shortName: 'MATH7',
    });

    const found = await service.list(school.id, schoolYear.id);
    expect(found.map((c) => c.name)).toEqual(['Mathematics 7']);
    expect(found[0].includeInCurriculumMaps).toBe(true);
    expect(found[0].sequenceNumber).toBe(0);
  });

  it('rejects a schoolYearId belonging to a different school with 400', async () => {
    const { school } = await createSchoolWithYear();
    const { schoolYear: otherYear } = await createSchoolWithYear();

    await expect(
      service.create(school.id, {
        schoolYearId: otherYear.id,
        name: 'Mathematics 7',
        shortName: 'MATH7',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects a departmentId belonging to a different school', async () => {
    const { school, schoolYear } = await createSchoolWithYear();
    const { school: otherSchool } = await createSchoolWithYear();
    const otherDepartment = await departments.save(
      departments.create({
        schoolId: otherSchool.id,
        type: 'LearningArea',
        name: 'Science',
        shortName: 'SCI',
      }),
    );

    await expect(
      service.create(school.id, {
        schoolYearId: schoolYear.id,
        departmentId: otherDepartment.id,
        name: 'Mathematics 7',
        shortName: 'MATH7',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('creates the CourseYearGroup join rows for yearGroupIds', async () => {
    const { school, schoolYear } = await createSchoolWithYear();
    const yearGroup = await yearGroups.save(
      yearGroups.create({
        schoolId: school.id,
        name: 'Year 7',
        shortName: 'Y7',
        sequenceNumber: 7,
      }),
    );

    const course = await service.create(school.id, {
      schoolYearId: schoolYear.id,
      name: 'Mathematics 7',
      shortName: 'MATH7',
      yearGroupIds: [yearGroup.id],
    });

    const joins = await courseYearGroups.findByCourse(course.id);
    expect(joins.map((j) => j.yearGroupId)).toEqual([yearGroup.id]);
  });

  it('rejects a yearGroupId belonging to a different school', async () => {
    const { school, schoolYear } = await createSchoolWithYear();
    const { school: otherSchool } = await createSchoolWithYear();
    const otherYearGroup = await yearGroups.save(
      yearGroups.create({
        schoolId: otherSchool.id,
        name: 'Year 7',
        shortName: 'Y7',
        sequenceNumber: 7,
      }),
    );

    await expect(
      service.create(school.id, {
        schoolYearId: schoolYear.id,
        name: 'Mathematics 7',
        shortName: 'MATH7',
        yearGroupIds: [otherYearGroup.id],
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('replaces the full yearGroupIds set on update', async () => {
    const { school, schoolYear } = await createSchoolWithYear();
    const [yearGroupA, yearGroupB] = await Promise.all([
      yearGroups.save(
        yearGroups.create({
          schoolId: school.id,
          name: 'Year 7',
          shortName: 'Y7',
          sequenceNumber: 7,
        }),
      ),
      yearGroups.save(
        yearGroups.create({
          schoolId: school.id,
          name: 'Year 8',
          shortName: 'Y8',
          sequenceNumber: 8,
        }),
      ),
    ]);
    const course = await service.create(school.id, {
      schoolYearId: schoolYear.id,
      name: 'Mathematics',
      shortName: 'MATH',
      yearGroupIds: [yearGroupA.id],
    });

    await service.update(school.id, course.id, {
      yearGroupIds: [yearGroupB.id],
    });

    const joins = await courseYearGroups.findByCourse(course.id);
    expect(joins.map((j) => j.yearGroupId)).toEqual([yearGroupB.id]);
  });

  it('throws NotFound updating a course belonging to a different school', async () => {
    const { school, schoolYear } = await createSchoolWithYear();
    const { school: otherSchool } = await createSchoolWithYear();
    const course = await service.create(school.id, {
      schoolYearId: schoolYear.id,
      name: 'Mathematics',
      shortName: 'MATH',
    });

    await expect(
      service.update(otherSchool.id, course.id, { name: 'Hijacked' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('rejects a duplicate (schoolId, schoolYearId, shortName) as a clean 409', async () => {
    const { school, schoolYear } = await createSchoolWithYear();
    await service.create(school.id, {
      schoolYearId: schoolYear.id,
      name: 'Mathematics',
      shortName: 'MATH',
    });

    await expect(
      service.create(school.id, {
        schoolYearId: schoolYear.id,
        name: 'Mathematics (duplicate)',
        shortName: 'MATH',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('allows the same shortName in a different school year', async () => {
    const { school, schoolYear } = await createSchoolWithYear();
    const otherYear = await schoolYears.save(
      schoolYears.create({
        schoolId: school.id,
        name: '2027',
        sequenceNumber: 2,
      }),
    );
    await service.create(school.id, {
      schoolYearId: schoolYear.id,
      name: 'Mathematics',
      shortName: 'MATH',
    });

    await expect(
      service.create(school.id, {
        schoolYearId: otherYear.id,
        name: 'Mathematics',
        shortName: 'MATH',
      }),
    ).resolves.toBeDefined();
  });

  it('soft-removes a course', async () => {
    const { school, schoolYear } = await createSchoolWithYear();
    const course = await service.create(school.id, {
      schoolYearId: schoolYear.id,
      name: 'Mathematics',
      shortName: 'MATH',
    });

    await service.remove(school.id, course.id);

    expect(await service.list(school.id)).toHaveLength(0);
  });
});
