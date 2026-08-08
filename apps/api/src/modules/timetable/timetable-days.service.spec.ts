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
import { SchoolYearsRepository } from '../school/repositories/school-years.repository';
import { TimetableColumnsService } from './timetable-columns.service';
import { TimetablesService } from './timetables.service';
import { TimetableDaysService } from './timetable-days.service';

describe('TimetableDaysService (integration)', () => {
  let module: TestingModule;
  let schools: SchoolsRepository;
  let schoolYears: SchoolYearsRepository;
  let columnsService: TimetableColumnsService;
  let timetablesService: TimetablesService;
  let service: TimetableDaysService;
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
    schoolYears = module.get(SchoolYearsRepository);
    columnsService = module.get(TimetableColumnsService);
    timetablesService = module.get(TimetablesService);
    service = module.get(TimetableDaysService);
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
    const column = await columnsService.create(school.id, {
      name: 'Week A',
      shortName: 'WKA',
    });
    const timetable = await timetablesService.create(school.id, {
      schoolYearId: schoolYear.id,
      name: 'Timetable',
      shortName: 'TT',
    });
    return { school, timetable, column };
  }

  it('creates a day and maps a date to it', async () => {
    const { school, timetable, column } = await setUp();

    const day = await service.create(school.id, timetable.id, {
      timetableColumnId: column.id,
      name: 'Mon A',
      shortName: 'MA',
      color: '#ff0000',
      fontColor: '#ffffff',
    });
    const mapping = await service.mapDate(school.id, day.id, '2025-03-03');

    expect(mapping.date).toBe('2025-03-03');
    expect(await service.listDates(day.id)).toHaveLength(1);
  });

  it('rejects mapping the same date twice within one timetable, to different days, as a clean 409', async () => {
    const { school, timetable, column } = await setUp();
    const dayA = await service.create(school.id, timetable.id, {
      timetableColumnId: column.id,
      name: 'Mon A',
      shortName: 'MA',
      color: '#ff0000',
      fontColor: '#ffffff',
    });
    const dayB = await service.create(school.id, timetable.id, {
      timetableColumnId: column.id,
      name: 'Mon B',
      shortName: 'MB',
      color: '#00ff00',
      fontColor: '#000000',
    });
    await service.mapDate(school.id, dayA.id, '2025-03-03');

    await expect(
      service.mapDate(school.id, dayB.id, '2025-03-03'),
    ).rejects.toThrow(ConflictException);
  });

  it('allows the same date to be mapped in two different timetables', async () => {
    const { school, timetable, column } = await setUp();
    const schoolYear = (
      await schoolYears.find({ where: { schoolId: school.id } })
    )[0];
    const otherTimetable = await timetablesService.create(school.id, {
      schoolYearId: schoolYear.id,
      name: 'Other Timetable',
      shortName: 'OTT',
    });
    const dayA = await service.create(school.id, timetable.id, {
      timetableColumnId: column.id,
      name: 'Mon A',
      shortName: 'MA',
      color: '#ff0000',
      fontColor: '#ffffff',
    });
    const dayB = await service.create(school.id, otherTimetable.id, {
      timetableColumnId: column.id,
      name: 'Mon A',
      shortName: 'MA',
      color: '#ff0000',
      fontColor: '#ffffff',
    });
    await service.mapDate(school.id, dayA.id, '2025-03-03');

    await expect(
      service.mapDate(school.id, dayB.id, '2025-03-03'),
    ).resolves.toBeDefined();
  });

  it('unmaps a date', async () => {
    const { school, timetable, column } = await setUp();
    const day = await service.create(school.id, timetable.id, {
      timetableColumnId: column.id,
      name: 'Mon A',
      shortName: 'MA',
      color: '#ff0000',
      fontColor: '#ffffff',
    });
    const mapping = await service.mapDate(school.id, day.id, '2025-03-03');

    await service.unmapDate(school.id, mapping.id);

    expect(await service.listDates(day.id)).toHaveLength(0);
  });

  it('rejects creating a day with a column from a different school', async () => {
    const { school, timetable } = await setUp();
    const otherSchoolColumn = await columnsService.create(
      (await setUp()).school.id,
      { name: 'Other', shortName: 'OTH' },
    );

    await expect(
      service.create(school.id, timetable.id, {
        timetableColumnId: otherSchoolColumn.id,
        name: 'Mon A',
        shortName: 'MA',
        color: '#ff0000',
        fontColor: '#ffffff',
      }),
    ).rejects.toThrow(NotFoundException);
  });
});
