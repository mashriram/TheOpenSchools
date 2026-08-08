import { randomUUID } from 'node:crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { SchoolModule } from '../school/school.module';
import { PeopleModule } from '../people/people.module';
import { CurriculumModule } from '../curriculum/curriculum.module';
import { TimetableModule } from './timetable.module';
import { SchoolsRepository } from '../school/repositories/schools.repository';
import { TimetableColumnsService } from './timetable-columns.service';

describe('TimetableColumnsService (integration)', () => {
  let module: TestingModule;
  let schools: SchoolsRepository;
  let service: TimetableColumnsService;
  let createdSchoolIds: string[];

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        DatabaseModule,
        SchoolModule,
        PeopleModule,
        CurriculumModule,
        TimetableModule,
      ],
    }).compile();

    schools = module.get(SchoolsRepository);
    service = module.get(TimetableColumnsService);
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

  async function createSchool() {
    const school = await schools.save(
      schools.create({ name: 'Test School', subdomainSlug: randomUUID() }),
    );
    createdSchoolIds.push(school.id);
    return school;
  }

  it('creates and lists a column scoped to its school', async () => {
    const school = await createSchool();

    await service.create(school.id, { name: 'Week A', shortName: 'WKA' });

    const found = await service.list(school.id);
    expect(found.map((c) => c.shortName)).toEqual(['WKA']);
  });

  it('rejects a duplicate short name within the same school as a clean 409', async () => {
    const school = await createSchool();
    await service.create(school.id, { name: 'Week A', shortName: 'WKA' });

    await expect(
      service.create(school.id, { name: 'Week A Again', shortName: 'WKA' }),
    ).rejects.toThrow(ConflictException);
  });

  it('throws NotFound updating a column belonging to a different school', async () => {
    const school = await createSchool();
    const otherSchool = await createSchool();
    const column = await service.create(school.id, {
      name: 'Week A',
      shortName: 'WKA',
    });

    await expect(
      service.update(otherSchool.id, column.id, { name: 'Hijacked' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('soft-removes a column', async () => {
    const school = await createSchool();
    const column = await service.create(school.id, {
      name: 'Week A',
      shortName: 'WKA',
    });

    await service.remove(school.id, column.id);

    expect(await service.list(school.id)).toHaveLength(0);
  });

  it('adds, updates, and removes rows on a column', async () => {
    const school = await createSchool();
    const column = await service.create(school.id, {
      name: 'Week A',
      shortName: 'WKA',
    });

    const row = await service.addRow(school.id, column.id, {
      name: 'Period 1',
      shortName: 'P1',
      timeStart: '09:00',
      timeEnd: '09:50',
      type: 'Lesson',
    });
    expect(await service.listRows(column.id)).toHaveLength(1);

    const updated = await service.updateRow(school.id, row.id, {
      name: 'Period 1B',
    });
    expect(updated.name).toBe('Period 1B');

    await service.removeRow(school.id, row.id);
    expect(await service.listRows(column.id)).toHaveLength(0);
  });

  it('rejects adding a row to a column from a different school', async () => {
    const school = await createSchool();
    const otherSchool = await createSchool();
    const column = await service.create(school.id, {
      name: 'Week A',
      shortName: 'WKA',
    });

    await expect(
      service.addRow(otherSchool.id, column.id, {
        name: 'Period 1',
        shortName: 'P1',
        timeStart: '09:00',
        timeEnd: '09:50',
        type: 'Lesson',
      }),
    ).rejects.toThrow(NotFoundException);
  });
});
