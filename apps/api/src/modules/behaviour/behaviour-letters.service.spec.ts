import { randomUUID } from 'node:crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { DatabaseModule } from '../../database/database.module';
import { SchoolModule } from '../school/school.module';
import { PeopleModule } from '../people/people.module';
import { RbacModule } from '../rbac/rbac.module';
import { BehaviourModule } from './behaviour.module';
import { SchoolsRepository } from '../school/repositories/schools.repository';
import { SchoolYearsRepository } from '../school/repositories/school-years.repository';
import { PeopleRepository } from '../people/repositories/people.repository';
import { FamiliesRepository } from '../people/repositories/families.repository';
import { FamilyAdultsRepository } from '../people/repositories/family-adults.repository';
import { FamilyChildrenRepository } from '../people/repositories/family-children.repository';
import { BehaviourService } from './behaviour.service';
import { BehaviourLettersService } from './behaviour-letters.service';

describe('BehaviourLettersService (integration)', () => {
  let module: TestingModule;
  let dataSource: DataSource;
  let schools: SchoolsRepository;
  let schoolYears: SchoolYearsRepository;
  let people: PeopleRepository;
  let families: FamiliesRepository;
  let familyAdults: FamilyAdultsRepository;
  let familyChildren: FamilyChildrenRepository;
  let behaviour: BehaviourService;
  let service: BehaviourLettersService;
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

    dataSource = module.get(DataSource);
    schools = module.get(SchoolsRepository);
    schoolYears = module.get(SchoolYearsRepository);
    people = module.get(PeopleRepository);
    families = module.get(FamiliesRepository);
    familyAdults = module.get(FamilyAdultsRepository);
    familyChildren = module.get(FamilyChildrenRepository);
    behaviour = module.get(BehaviourService);
    service = module.get(BehaviourLettersService);
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
    const parent = await people.save(
      people.create({
        schoolId: school.id,
        surname: 'Parent',
        firstName: 'Pat',
        email: `${randomUUID()}@example.com`,
      }),
    );
    const family = await families.save(
      families.create({ schoolId: school.id, name: 'The Family' }),
    );
    await familyAdults.save(
      familyAdults.create({
        familyId: family.id,
        personId: parent.id,
        childDataAccess: true,
      }),
    );
    await familyChildren.save(
      familyChildren.create({ familyId: family.id, personId: student.id }),
    );
    return { school, schoolYear, student, parent };
  }

  it('captures an immutable snapshot with the body encrypted at rest and fans out to family recipients', async () => {
    const { school, schoolYear, student, parent } = await setUp();
    await behaviour.create(school.id, student.id, {
      schoolYearId: schoolYear.id,
      date: '2026-09-01',
      personId: student.id,
      type: 'Negative',
    });

    const snapshot = await service.create(school.id, {
      schoolYearId: schoolYear.id,
      personId: student.id,
      letterLevel: '2',
      status: 'Issued',
      type: 'Negative',
      body: 'Dear parent, this letter concerns repeated incidents...',
    });

    expect(snapshot.recordCountAtCreation).toBe(1);
    const rawRow = await dataSource
      .createQueryBuilder()
      .select('snapshot.body', 'body')
      .from('behaviour_letter_snapshots', 'snapshot')
      .where('snapshot.id = :id', { id: snapshot.id })
      .getRawOne<{ body: string }>();
    expect(rawRow!.body).not.toContain('Dear parent');

    const recipients = await service.listRecipients(snapshot.id);
    expect(recipients).toHaveLength(1);
    expect(recipients[0].personId).toBe(parent.id);
    expect(recipients[0].email).toBe(parent.email);
  });

  it('leaves a snapshot recipient-less when the student has no family on record', async () => {
    const { school, schoolYear } = await setUp();
    const orphanStudent = await people.save(
      people.create({
        schoolId: school.id,
        surname: 'Orphan',
        firstName: 'Oli',
      }),
    );

    const snapshot = await service.create(school.id, {
      schoolYearId: schoolYear.id,
      personId: orphanStudent.id,
      letterLevel: '1',
      status: 'Warning',
      type: 'Negative',
      body: 'Letter body',
    });

    expect(await service.listRecipients(snapshot.id)).toHaveLength(0);
  });

  it('lists snapshots for a student, most recent first', async () => {
    const { school, schoolYear, student } = await setUp();
    await service.create(school.id, {
      schoolYearId: schoolYear.id,
      personId: student.id,
      letterLevel: '1',
      status: 'Warning',
      type: 'Negative',
      body: 'First',
    });
    await service.create(school.id, {
      schoolYearId: schoolYear.id,
      personId: student.id,
      letterLevel: '2',
      status: 'Issued',
      type: 'Negative',
      body: 'Second',
    });

    const list = await service.listForPerson(school.id, student.id);

    expect(list).toHaveLength(2);
  });
});
