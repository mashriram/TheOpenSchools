import { randomUUID } from 'node:crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { DatabaseModule } from '../../database/database.module';
import { SchoolModule } from '../school/school.module';
import { PeopleModule } from '../people/people.module';
import { CurriculumModule } from '../curriculum/curriculum.module';
import { RbacModule } from '../rbac/rbac.module';
import { IndividualNeedsModule } from './individual-needs.module';
import { SchoolsRepository } from '../school/repositories/schools.repository';
import { SchoolYearsRepository } from '../school/repositories/school-years.repository';
import { PeopleRepository } from '../people/repositories/people.repository';
import { IndividualNeedInvestigationsService } from './individual-need-investigations.service';

describe('IndividualNeedInvestigationsService (integration)', () => {
  let module: TestingModule;
  let dataSource: DataSource;
  let schools: SchoolsRepository;
  let schoolYears: SchoolYearsRepository;
  let people: PeopleRepository;
  let service: IndividualNeedInvestigationsService;
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
    schoolYears = module.get(SchoolYearsRepository);
    people = module.get(PeopleRepository);
    service = module.get(IndividualNeedInvestigationsService);
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
    const student = await people.save(
      people.create({
        schoolId: school.id,
        surname: 'Student',
        firstName: 'Sam',
      }),
    );
    const creator = await people.save(
      people.create({
        schoolId: school.id,
        surname: 'Teacher',
        firstName: 'Tia',
      }),
    );
    return { school, schoolYear, student, creator };
  }

  it('creates an investigation with reason encrypted at rest', async () => {
    const { school, schoolYear, student, creator } = await setUp();

    const investigation = await service.create(school.id, creator.id, {
      schoolYearId: schoolYear.id,
      studentPersonId: student.id,
      date: '2026-09-01',
      reason: 'Repeated lateness and withdrawal in class',
    });

    const rawRow = await dataSource
      .createQueryBuilder()
      .select('investigation.reason', 'reason')
      .from('individual_need_investigations', 'investigation')
      .where('investigation.id = :id', { id: investigation.id })
      .getRawOne<{ reason: string }>();
    expect(rawRow!.reason).not.toContain('Repeated lateness');

    const reread = await service.getOwned(school.id, investigation.id);
    expect(reread.reason).toBe('Repeated lateness and withdrawal in class');
    expect(reread.status).toBe('Referral');
  });

  it('rejects a schoolYearId from a different school with 400', async () => {
    const { school, student, creator } = await setUp();
    const { schoolYear: otherYear } = await setUp();

    await expect(
      service.create(school.id, creator.id, {
        schoolYearId: otherYear.id,
        studentPersonId: student.id,
        date: '2026-09-01',
        reason: 'Reason',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('updates status and resolution details', async () => {
    const { school, schoolYear, student, creator } = await setUp();
    const investigation = await service.create(school.id, creator.id, {
      schoolYearId: schoolYear.id,
      studentPersonId: student.id,
      date: '2026-09-01',
      reason: 'Reason',
    });

    const updated = await service.update(school.id, investigation.id, {
      status: 'Resolved',
      resolutionDetails: 'Met with family, arranged support plan',
    });

    expect(updated.status).toBe('Resolved');
    expect(updated.resolutionDetails).toBe(
      'Met with family, arranged support plan',
    );
  });

  it('lists investigations for a student, most recent first', async () => {
    const { school, schoolYear, student, creator } = await setUp();
    await service.create(school.id, creator.id, {
      schoolYearId: schoolYear.id,
      studentPersonId: student.id,
      date: '2026-09-01',
      reason: 'First',
    });
    await service.create(school.id, creator.id, {
      schoolYearId: schoolYear.id,
      studentPersonId: student.id,
      date: '2026-09-15',
      reason: 'Second',
    });

    const list = await service.listForStudent(school.id, student.id);

    expect(list).toHaveLength(2);
    expect(list[0].date).toBe('2026-09-15');
  });

  it('throws NotFound for an investigation belonging to a different school', async () => {
    const { school, schoolYear, student, creator } = await setUp();
    const investigation = await service.create(school.id, creator.id, {
      schoolYearId: schoolYear.id,
      studentPersonId: student.id,
      date: '2026-09-01',
      reason: 'Reason',
    });
    const { school: otherSchool } = await setUp();

    await expect(
      service.getOwned(otherSchool.id, investigation.id),
    ).rejects.toThrow(NotFoundException);
  });
});
