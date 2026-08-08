import { randomUUID } from 'node:crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { NotFoundException } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { SchoolModule } from '../school/school.module';
import { PeopleModule } from '../people/people.module';
import { CurriculumModule } from './curriculum.module';
import { SchoolsRepository } from '../school/repositories/schools.repository';
import { SchoolYearsRepository } from '../school/repositories/school-years.repository';
import { CoursesService } from './courses.service';
import { UnitsService } from './units.service';

describe('UnitsService (integration)', () => {
  let module: TestingModule;
  let schools: SchoolsRepository;
  let schoolYears: SchoolYearsRepository;
  let courses: CoursesService;
  let service: UnitsService;
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
    service = module.get(UnitsService);
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

  it('creates and lists a unit scoped to its course', async () => {
    const { school, course } = await createFixture();

    await service.create(school.id, course.id, { name: 'Fractions' });

    const found = await service.list(school.id, course.id);
    expect(found.map((u) => u.name)).toEqual(['Fractions']);
    expect(found[0].active).toBe(true);
  });

  it('throws NotFound creating a unit under a course from a different school', async () => {
    const { course } = await createFixture();
    const { school: otherSchool } = await createFixture();

    await expect(
      service.create(otherSchool.id, course.id, { name: 'Fractions' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('updates a unit', async () => {
    const { school, course } = await createFixture();
    const unit = await service.create(school.id, course.id, {
      name: 'Fractions',
    });

    const updated = await service.update(school.id, unit.id, {
      active: false,
    });

    expect(updated.active).toBe(false);
  });

  it('throws NotFound updating a unit belonging to a different school', async () => {
    const { school, course } = await createFixture();
    const { school: otherSchool } = await createFixture();
    const unit = await service.create(school.id, course.id, {
      name: 'Fractions',
    });

    await expect(
      service.update(otherSchool.id, unit.id, { name: 'Hijacked' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('soft-removes a unit', async () => {
    const { school, course } = await createFixture();
    const unit = await service.create(school.id, course.id, {
      name: 'Fractions',
    });

    await service.remove(school.id, unit.id);

    expect(await service.list(school.id, course.id)).toHaveLength(0);
  });
});
