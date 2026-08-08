import { randomUUID } from 'node:crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { AbilityBuilder, createMongoAbility } from '@casl/ability';
import { DataSource } from 'typeorm';
import { DatabaseModule } from '../../database/database.module';
import { SchoolModule } from '../school/school.module';
import { PeopleModule } from '../people/people.module';
import { CurriculumModule } from '../curriculum/curriculum.module';
import { RbacModule } from '../rbac/rbac.module';
import { IndividualNeedsModule } from './individual-needs.module';
import { SchoolsRepository } from '../school/repositories/schools.repository';
import { PeopleRepository } from '../people/repositories/people.repository';
import type { AppAbility } from '../rbac/casl-ability.factory';
import { IndividualNeedsService } from './individual-needs.service';
import { IndividualNeedsRepository } from './repositories/individual-needs.repository';

function buildAbility(
  configure: (builder: AbilityBuilder<AppAbility>) => void,
): AppAbility {
  const builder = new AbilityBuilder<AppAbility>(createMongoAbility);
  configure(builder);
  return builder.build();
}

describe('IndividualNeedsService (integration)', () => {
  let module: TestingModule;
  let dataSource: DataSource;
  let schools: SchoolsRepository;
  let people: PeopleRepository;
  let needs: IndividualNeedsRepository;
  let service: IndividualNeedsService;
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
        IndividualNeedsModule,
      ],
    }).compile();

    dataSource = module.get(DataSource);
    schools = module.get(SchoolsRepository);
    people = module.get(PeopleRepository);
    needs = module.get(IndividualNeedsRepository);
    service = module.get(IndividualNeedsService);
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
    const student = await people.save(
      people.create({
        schoolId: school.id,
        surname: 'Student',
        firstName: 'Sam',
      }),
    );
    return { school, student };
  }

  describe('upsert + getDetail', () => {
    it('round-trips narrative fields encrypted at rest', async () => {
      const { school, student } = await setUp();

      await service.upsert(school.id, student.id, {
        strategies: 'Extra time for exams',
        targets: 'Improve reading fluency',
        notes: 'Reviewed with SENCO',
      });

      const rawRow = await dataSource
        .createQueryBuilder()
        .select('need.strategies', 'strategies')
        .from('individual_needs', 'need')
        .where('need.personId = :personId', { personId: student.id })
        .getRawOne<{ strategies: string }>();
      expect(rawRow!.strategies).not.toContain('Extra time for exams');
      expect(rawRow!.strategies).toContain(':');

      const detail = await service.getDetail(school.id, student.id);
      expect(detail.strategies).toBe('Extra time for exams');
      expect(detail.targets).toBe('Improve reading fluency');
    });

    it('upserts in place rather than creating a second row', async () => {
      const { school, student } = await setUp();
      await service.upsert(school.id, student.id, { notes: 'first' });

      await service.upsert(school.id, student.id, { notes: 'second' });

      const rows = await needs.find({ where: { personId: student.id } });
      expect(rows).toHaveLength(1);
      expect(rows[0].notes).toBe('second');
    });
  });

  describe('getSummary', () => {
    it('never includes narrative fields, even if a record exists', async () => {
      const { school, student } = await setUp();
      await service.upsert(school.id, student.id, {
        notes: 'Confidential note',
      });
      await service.setDescriptor(school.id, student.id, {
        descriptor: 'SEN',
        level: 'High',
      });

      const summary = await service.getSummary(school.id, student.id);

      expect(summary).not.toHaveProperty('notes');
      expect(summary).not.toHaveProperty('strategies');
      expect(summary.descriptors).toEqual([
        expect.objectContaining({ descriptor: 'SEN', level: 'High' }),
      ]);
    });
  });

  describe('getForCaller - the real Gibbon read-side gap fix', () => {
    it('returns only the summary shape for a caller without individualNeeds.detail.view', async () => {
      const { school, student } = await setUp();
      await service.upsert(school.id, student.id, {
        notes: 'Confidential note',
      });
      // Mirrors the default Teacher role: summary.view granted, detail.view not.
      const teacherAbility = buildAbility(({ can }) =>
        can('view', 'IndividualNeedSummary'),
      );

      const result = await service.getForCaller(
        school.id,
        student.id,
        teacherAbility,
      );

      expect(result).not.toHaveProperty('notes');
      expect(result).not.toHaveProperty('strategies');
      expect(result).not.toHaveProperty('targets');
    });

    it('returns the full detail shape for a caller with individualNeeds.detail.view', async () => {
      const { school, student } = await setUp();
      await service.upsert(school.id, student.id, {
        notes: 'Confidential note',
      });
      const sencoAbility = buildAbility(({ can }) => {
        can('view', 'IndividualNeedSummary');
        can('view', 'IndividualNeedDetail');
      });

      const result = await service.getForCaller(
        school.id,
        student.id,
        sencoAbility,
      );

      expect(result).toHaveProperty('notes', 'Confidential note');
    });
  });

  describe('descriptors', () => {
    it('rejects setting a descriptor for a person from a different school', async () => {
      const { student } = await setUp();
      const { school: otherSchool } = await setUp();

      await expect(
        service.setDescriptor(otherSchool.id, student.id, {
          descriptor: 'EAL',
        }),
      ).rejects.toThrow();
    });

    it('updates the level in place for the same descriptor', async () => {
      const { school, student } = await setUp();
      await service.setDescriptor(school.id, student.id, {
        descriptor: 'SEN',
        level: 'Low',
      });

      await service.setDescriptor(school.id, student.id, {
        descriptor: 'SEN',
        level: 'High',
      });

      const summary = await service.getSummary(school.id, student.id);
      expect(summary.descriptors).toHaveLength(1);
      expect(summary.descriptors[0].level).toBe('High');
    });
  });
});
