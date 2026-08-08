import { randomUUID } from 'node:crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { ConflictException } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { SchoolModule } from '../school/school.module';
import { MarkbookModule } from './markbook.module';
import { SchoolsRepository } from '../school/repositories/schools.repository';
import { ScalesService } from './scales.service';
import { ScaleGradesService } from './scale-grades.service';

describe('ScaleGradesService (integration)', () => {
  let module: TestingModule;
  let schools: SchoolsRepository;
  let scales: ScalesService;
  let service: ScaleGradesService;
  let createdSchoolIds: string[];

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        DatabaseModule,
        SchoolModule,
        MarkbookModule,
      ],
    }).compile();

    schools = module.get(SchoolsRepository);
    scales = module.get(ScalesService);
    service = module.get(ScaleGradesService);
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

  async function createSchoolWithScale() {
    const school = await schools.save(
      schools.create({ name: 'Test School', subdomainSlug: randomUUID() }),
    );
    createdSchoolIds.push(school.id);
    const scale = await scales.create(school.id, {
      name: 'Attainment Scale',
      shortName: 'ATT',
    });
    return { school, scale };
  }

  it('creates grades ordered by sequenceNumber', async () => {
    const { school, scale } = await createSchoolWithScale();

    await service.create(school.id, scale.id, {
      name: 'Below',
      shortName: 'B',
      value: 1,
      sequenceNumber: 1,
      lowestAcceptable: true,
    });
    await service.create(school.id, scale.id, {
      name: 'Above',
      shortName: 'A',
      value: 2,
      sequenceNumber: 0,
    });

    const grades = await service.list(school.id, scale.id);
    expect(grades.map((g) => g.shortName)).toEqual(['A', 'B']);
  });

  it('rejects a duplicate short name within the same scale as a clean 409', async () => {
    const { school, scale } = await createSchoolWithScale();
    await service.create(school.id, scale.id, {
      name: 'Below',
      shortName: 'B',
      value: 1,
    });

    await expect(
      service.create(school.id, scale.id, {
        name: 'Below Again',
        shortName: 'B',
        value: 1,
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('hard-removes a grade', async () => {
    const { school, scale } = await createSchoolWithScale();
    const grade = await service.create(school.id, scale.id, {
      name: 'Below',
      shortName: 'B',
      value: 1,
    });

    await service.remove(school.id, grade.id);

    expect(await service.list(school.id, scale.id)).toHaveLength(0);
  });
});
