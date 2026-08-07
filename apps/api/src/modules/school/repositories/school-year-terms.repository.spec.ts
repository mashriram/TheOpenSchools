import { randomUUID } from 'node:crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { QueryFailedError } from 'typeorm';
import { DatabaseModule } from '../../../database/database.module';
import { SchoolModule } from '../school.module';
import { SchoolsRepository } from './schools.repository';
import { SchoolYearsRepository } from './school-years.repository';
import { SchoolYearTermsRepository } from './school-year-terms.repository';
import { School } from '../entities/school.entity';
import { SchoolYear } from '../entities/school-year.entity';
import { SchoolYearTerm } from '../entities/school-year-term.entity';

describe('SchoolYearTermsRepository (integration)', () => {
  let module: TestingModule;
  let schools: SchoolsRepository;
  let schoolYears: SchoolYearsRepository;
  let terms: SchoolYearTermsRepository;
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
    terms = module.get(SchoolYearTermsRepository);
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(() => {
    createdSchoolIds = [];
  });

  afterEach(async () => {
    // Cascades through school_years -> school_year_terms transitively.
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

  async function createSchoolYear(schoolId: string): Promise<SchoolYear> {
    return schoolYears.save(
      schoolYears.create({ schoolId, name: '2025-2026', sequenceNumber: 1 }),
    );
  }

  function buildTerm(
    schoolYearId: string,
    overrides: Partial<SchoolYearTerm> = {},
  ) {
    return terms.create({
      schoolYearId,
      sequenceNumber: 1,
      name: 'Term 1',
      shortName: 'T1',
      firstDay: '2025-09-01',
      lastDay: '2025-12-19',
      ...overrides,
    });
  }

  it('persists a term under a school year', async () => {
    const school = await createSchool();
    const year = await createSchoolYear(school.id);

    const term = await terms.save(buildTerm(year.id));

    expect(term.id).toBeDefined();
    expect(term.schoolYearId).toBe(year.id);
  });

  it('findBySchoolYear returns terms ordered by sequenceNumber', async () => {
    const school = await createSchool();
    const year = await createSchoolYear(school.id);
    await terms.save(
      buildTerm(year.id, {
        sequenceNumber: 3,
        name: 'Term 3',
        shortName: 'T3',
      }),
    );
    await terms.save(
      buildTerm(year.id, {
        sequenceNumber: 1,
        name: 'Term 1',
        shortName: 'T1',
      }),
    );
    await terms.save(
      buildTerm(year.id, {
        sequenceNumber: 2,
        name: 'Term 2',
        shortName: 'T2',
      }),
    );

    const found = await terms.findBySchoolYear(year.id);

    expect(found.map((t) => t.sequenceNumber)).toEqual([1, 2, 3]);
  });

  it('findBySchoolYear only returns terms for the given school year', async () => {
    const school = await createSchool();
    const yearA = await createSchoolYear(school.id);
    const yearB = await schoolYears.save(
      schoolYears.create({
        schoolId: school.id,
        name: '2026-2027',
        sequenceNumber: 2,
      }),
    );
    await terms.save(buildTerm(yearA.id, { name: 'A-Term' }));
    await terms.save(buildTerm(yearB.id, { name: 'B-Term' }));

    const found = await terms.findBySchoolYear(yearA.id);

    expect(found).toHaveLength(1);
    expect(found[0].name).toBe('A-Term');
  });

  it('rejects two terms with the same sequenceNumber under the same school year', async () => {
    const school = await createSchool();
    const year = await createSchoolYear(school.id);
    await terms.save(buildTerm(year.id, { sequenceNumber: 1 }));

    await expect(
      terms.save(
        buildTerm(year.id, { sequenceNumber: 1, name: 'Duplicate Term' }),
      ),
    ).rejects.toThrow(QueryFailedError);
  });

  it('allows the same sequenceNumber across two different school years', async () => {
    const school = await createSchool();
    const yearA = await createSchoolYear(school.id);
    const yearB = await schoolYears.save(
      schoolYears.create({
        schoolId: school.id,
        name: '2026-2027',
        sequenceNumber: 2,
      }),
    );

    await terms.save(buildTerm(yearA.id, { sequenceNumber: 1 }));
    const termB = await terms.save(buildTerm(yearB.id, { sequenceNumber: 1 }));

    expect(termB.sequenceNumber).toBe(1);
  });

  it('cascade-deletes terms when the parent school year is hard-deleted', async () => {
    const school = await createSchool();
    const year = await createSchoolYear(school.id);
    const term = await terms.save(buildTerm(year.id));

    await schoolYears.delete(year.id);

    expect(await terms.findOne({ where: { id: term.id } })).toBeNull();
  });

  it('cascade-deletes terms transitively when the top-level school is hard-deleted', async () => {
    const school = await createSchool();
    const year = await createSchoolYear(school.id);
    const term = await terms.save(buildTerm(year.id));

    await schools.delete(school.id);
    createdSchoolIds = createdSchoolIds.filter((id) => id !== school.id);

    expect(await terms.findOne({ where: { id: term.id } })).toBeNull();
  });
});
