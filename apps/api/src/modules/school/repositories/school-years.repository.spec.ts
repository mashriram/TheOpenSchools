import { randomUUID } from 'node:crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { QueryFailedError } from 'typeorm';
import { DatabaseModule } from '../../../database/database.module';
import { SchoolModule } from '../school.module';
import { SchoolsRepository } from './schools.repository';
import { SchoolYearsRepository } from './school-years.repository';
import { School } from '../entities/school.entity';
import { SchoolYear } from '../entities/school-year.entity';

describe('SchoolYearsRepository (integration)', () => {
  let module: TestingModule;
  let schools: SchoolsRepository;
  let schoolYears: SchoolYearsRepository;
  let createdSchoolIds: string[];

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        DatabaseModule,
        SchoolModule,
      ],
    }).compile();

    schools = module.get(SchoolsRepository);
    schoolYears = module.get(SchoolYearsRepository);
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(() => {
    createdSchoolIds = [];
  });

  afterEach(async () => {
    // Hard delete cascades to school_years/school_year_terms via the real FK
    // ON DELETE CASCADE declared in the M1 migration - one call cleans up
    // everything created under this school for the test.
    if (createdSchoolIds.length > 0) {
      await schools.delete(createdSchoolIds);
    }
  });

  async function createSchool(): Promise<School> {
    const school = await schools.save(
      schools.create({ name: 'Test School', subdomainSlug: randomUUID() }),
    );
    createdSchoolIds.push(school.id);
    return school;
  }

  function buildYear(schoolId: string, overrides: Partial<SchoolYear> = {}) {
    return schoolYears.create({
      schoolId,
      name: '2025-2026',
      sequenceNumber: 1,
      ...overrides,
    });
  }

  it('persists a school year under a school', async () => {
    const school = await createSchool();

    const year = await schoolYears.save(buildYear(school.id));

    expect(year.id).toBeDefined();
    expect(year.schoolId).toBe(school.id);
  });

  it('applies the default status of Upcoming when not provided', async () => {
    const school = await createSchool();

    const year = await schoolYears.save(buildYear(school.id));

    expect(year.status).toBe('Upcoming');
  });

  it('allows firstDay/lastDay to be omitted', async () => {
    const school = await createSchool();

    const year = await schoolYears.save(buildYear(school.id));

    expect(year.firstDay).toBeNull();
    expect(year.lastDay).toBeNull();
  });

  it('findBySchool returns years ordered by sequenceNumber', async () => {
    const school = await createSchool();
    await schoolYears.save(
      buildYear(school.id, { name: '2026-2027', sequenceNumber: 2 }),
    );
    await schoolYears.save(
      buildYear(school.id, { name: '2024-2025', sequenceNumber: 0 }),
    );
    await schoolYears.save(
      buildYear(school.id, { name: '2025-2026', sequenceNumber: 1 }),
    );

    const found = await schoolYears.findBySchool(school.id);

    expect(found.map((y) => y.sequenceNumber)).toEqual([0, 1, 2]);
  });

  it('findBySchool only returns years for the given school, not other schools', async () => {
    const schoolA = await createSchool();
    const schoolB = await createSchool();
    await schoolYears.save(buildYear(schoolA.id, { name: 'A-Year' }));
    await schoolYears.save(buildYear(schoolB.id, { name: 'B-Year' }));

    const found = await schoolYears.findBySchool(schoolA.id);

    expect(found).toHaveLength(1);
    expect(found[0].name).toBe('A-Year');
  });

  it('findCurrentForSchool returns the year with status Current', async () => {
    const school = await createSchool();
    await schoolYears.save(
      buildYear(school.id, { name: '2024-2025', status: 'Past' }),
    );
    const current = await schoolYears.save(
      buildYear(school.id, { name: '2025-2026', status: 'Current' }),
    );
    await schoolYears.save(
      buildYear(school.id, { name: '2026-2027', status: 'Upcoming' }),
    );

    const found = await schoolYears.findCurrentForSchool(school.id);

    expect(found?.id).toBe(current.id);
  });

  it('findCurrentForSchool returns null when no year is marked Current', async () => {
    const school = await createSchool();
    await schoolYears.save(buildYear(school.id, { status: 'Upcoming' }));

    expect(await schoolYears.findCurrentForSchool(school.id)).toBeNull();
  });

  it('rejects two years with the same name under the same school', async () => {
    const school = await createSchool();
    await schoolYears.save(buildYear(school.id, { name: '2025-2026' }));

    await expect(
      schoolYears.save(
        buildYear(school.id, { name: '2025-2026', sequenceNumber: 2 }),
      ),
    ).rejects.toThrow(QueryFailedError);
  });

  it('allows the same year name across two different schools', async () => {
    const schoolA = await createSchool();
    const schoolB = await createSchool();

    await schoolYears.save(buildYear(schoolA.id, { name: '2025-2026' }));
    const yearB = await schoolYears.save(
      buildYear(schoolB.id, { name: '2025-2026' }),
    );

    expect(yearB.name).toBe('2025-2026');
  });

  it('cascade-deletes school years when the parent school is hard-deleted', async () => {
    const school = await createSchool();
    const year = await schoolYears.save(buildYear(school.id));

    await schools.delete(school.id);
    createdSchoolIds = createdSchoolIds.filter((id) => id !== school.id);

    expect(await schoolYears.findOne({ where: { id: year.id } })).toBeNull();
  });
});
