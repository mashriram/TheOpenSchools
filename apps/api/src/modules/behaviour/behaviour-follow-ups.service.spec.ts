import { randomUUID } from 'node:crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { NotFoundException } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { SchoolModule } from '../school/school.module';
import { PeopleModule } from '../people/people.module';
import { RbacModule } from '../rbac/rbac.module';
import { BehaviourModule } from './behaviour.module';
import { SchoolsRepository } from '../school/repositories/schools.repository';
import { SchoolYearsRepository } from '../school/repositories/school-years.repository';
import { PeopleRepository } from '../people/repositories/people.repository';
import { BehaviourService } from './behaviour.service';
import { BehaviourFollowUpsService } from './behaviour-follow-ups.service';

describe('BehaviourFollowUpsService (integration)', () => {
  let module: TestingModule;
  let schools: SchoolsRepository;
  let schoolYears: SchoolYearsRepository;
  let people: PeopleRepository;
  let behaviour: BehaviourService;
  let service: BehaviourFollowUpsService;
  let createdSchoolIds: string[];

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        DatabaseModule,
        SchoolModule,
        PeopleModule,
        RbacModule,
        BehaviourModule,
      ],
    }).compile();

    schools = module.get(SchoolsRepository);
    schoolYears = module.get(SchoolYearsRepository);
    people = module.get(PeopleRepository);
    behaviour = module.get(BehaviourService);
    service = module.get(BehaviourFollowUpsService);
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
    const teacher = await people.save(
      people.create({
        schoolId: school.id,
        surname: 'Teacher',
        firstName: 'Tia',
      }),
    );
    const record = await behaviour.create(school.id, teacher.id, {
      schoolYearId: schoolYear.id,
      date: '2026-09-01',
      personId: student.id,
      type: 'Negative',
    });
    return { school, teacher, record };
  }

  it('adds and lists follow-ups for a record', async () => {
    const { school, teacher, record } = await setUp();

    await service.create(school.id, record.id, teacher.id, {
      followUp: 'Met with student',
    });

    const list = await service.list(school.id, record.id);
    expect(list).toHaveLength(1);
    expect(list[0].followUp).toBe('Met with student');
  });

  it('throws NotFound removing a follow-up belonging to a different school', async () => {
    const { school, teacher, record } = await setUp();
    const other = await setUp();
    const followUp = await service.create(school.id, record.id, teacher.id, {
      followUp: 'Note',
    });

    await expect(service.remove(other.school.id, followUp.id)).rejects.toThrow(
      NotFoundException,
    );
  });
});
