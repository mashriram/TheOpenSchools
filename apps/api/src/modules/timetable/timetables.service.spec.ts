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
import { CurriculumModule } from '../curriculum/curriculum.module';
import { TimetableModule } from './timetable.module';
import { SchoolsRepository } from '../school/repositories/schools.repository';
import { SchoolYearsRepository } from '../school/repositories/school-years.repository';
import { YearGroupsRepository } from '../school/repositories/year-groups.repository';
import { TimetablesService } from './timetables.service';
import { TimetableYearGroupsRepository } from './repositories/timetable-year-groups.repository';

describe('TimetablesService (integration)', () => {
  let module: TestingModule;
  let schools: SchoolsRepository;
  let schoolYears: SchoolYearsRepository;
  let yearGroups: YearGroupsRepository;
  let timetableYearGroups: TimetableYearGroupsRepository;
  let service: TimetablesService;
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
    yearGroups = module.get(YearGroupsRepository);
    timetableYearGroups = module.get(TimetableYearGroupsRepository);
    service = module.get(TimetablesService);
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
        name: '2024-25',
        sequenceNumber: 1,
      }),
    );
    return { school, schoolYear };
  }

  it('creates a timetable with year-group associations', async () => {
    const { school, schoolYear } = await createSchoolWithYear();
    const yearGroup = await yearGroups.save(
      yearGroups.create({
        schoolId: school.id,
        name: 'Year 7',
        shortName: 'Y7',
        sequenceNumber: 1,
      }),
    );

    const timetable = await service.create(school.id, {
      schoolYearId: schoolYear.id,
      name: '2024-25 Timetable',
      shortName: 'TT2425',
      yearGroupIds: [yearGroup.id],
    });

    expect(
      await timetableYearGroups.findByTimetable(timetable.id),
    ).toHaveLength(1);
  });

  it('rejects a schoolYearId from a different school with 400', async () => {
    const { school } = await createSchoolWithYear();
    const { schoolYear: otherYear } = await createSchoolWithYear();

    await expect(
      service.create(school.id, {
        schoolYearId: otherYear.id,
        name: 'Bad',
        shortName: 'BAD',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects a duplicate short name within the same school year as a clean 409', async () => {
    const { school, schoolYear } = await createSchoolWithYear();
    await service.create(school.id, {
      schoolYearId: schoolYear.id,
      name: 'Timetable',
      shortName: 'TT',
    });

    await expect(
      service.create(school.id, {
        schoolYearId: schoolYear.id,
        name: 'Timetable Again',
        shortName: 'TT',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('replaces the full year-group set on update', async () => {
    const { school, schoolYear } = await createSchoolWithYear();
    const yg1 = await yearGroups.save(
      yearGroups.create({
        schoolId: school.id,
        name: 'Year 7',
        shortName: 'Y7',
        sequenceNumber: 1,
      }),
    );
    const yg2 = await yearGroups.save(
      yearGroups.create({
        schoolId: school.id,
        name: 'Year 8',
        shortName: 'Y8',
        sequenceNumber: 2,
      }),
    );
    const timetable = await service.create(school.id, {
      schoolYearId: schoolYear.id,
      name: 'Timetable',
      shortName: 'TT',
      yearGroupIds: [yg1.id],
    });

    await service.update(school.id, timetable.id, { yearGroupIds: [yg2.id] });

    const linked = await timetableYearGroups.findByTimetable(timetable.id);
    expect(linked.map((l) => l.yearGroupId)).toEqual([yg2.id]);
  });

  it('throws NotFound updating a timetable belonging to a different school', async () => {
    const { school, schoolYear } = await createSchoolWithYear();
    const { school: otherSchool } = await createSchoolWithYear();
    const timetable = await service.create(school.id, {
      schoolYearId: schoolYear.id,
      name: 'Timetable',
      shortName: 'TT',
    });

    await expect(
      service.update(otherSchool.id, timetable.id, { name: 'Hijacked' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('soft-removes a timetable', async () => {
    const { school, schoolYear } = await createSchoolWithYear();
    const timetable = await service.create(school.id, {
      schoolYearId: schoolYear.id,
      name: 'Timetable',
      shortName: 'TT',
    });

    await service.remove(school.id, timetable.id);

    expect(await service.list(school.id)).toHaveLength(0);
  });
});
