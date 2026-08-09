import { randomUUID } from 'node:crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { DatabaseModule } from '../../database/database.module';
import { SchoolModule } from '../school/school.module';
import { PeopleModule } from '../people/people.module';
import { RbacModule } from '../rbac/rbac.module';
import { BehaviourModule } from './behaviour.module';
import { SchoolsRepository } from '../school/repositories/schools.repository';
import { SchoolYearsRepository } from '../school/repositories/school-years.repository';
import { PeopleRepository } from '../people/repositories/people.repository';
import { RolesRepository } from '../rbac/repositories/roles.repository';
import { FamiliesRepository } from '../people/repositories/families.repository';
import { FamilyAdultsRepository } from '../people/repositories/family-adults.repository';
import { FamilyChildrenRepository } from '../people/repositories/family-children.repository';
import { BehaviourService } from './behaviour.service';

describe('BehaviourService (integration)', () => {
  let module: TestingModule;
  let dataSource: DataSource;
  let schools: SchoolsRepository;
  let schoolYears: SchoolYearsRepository;
  let people: PeopleRepository;
  let roles: RolesRepository;
  let families: FamiliesRepository;
  let familyAdults: FamilyAdultsRepository;
  let familyChildren: FamilyChildrenRepository;
  let service: BehaviourService;
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
    roles = module.get(RolesRepository);
    families = module.get(FamiliesRepository);
    familyAdults = module.get(FamilyAdultsRepository);
    familyChildren = module.get(FamilyChildrenRepository);
    service = module.get(BehaviourService);
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
    return { school, schoolYear, student, teacher };
  }

  async function setUpRoleActor(
    schoolId: string,
    category: 'Staff' | 'Student' | 'Parent',
  ) {
    const role = await roles.save(
      roles.create({
        schoolId,
        category,
        name: randomUUID(),
        shortName: category.slice(0, 3),
        description: 'test role',
        restriction: 'None',
      }),
    );
    const person = await people.save(
      people.create({ schoolId, surname: category, firstName: 'Actor' }),
    );
    return { role, person };
  }

  it('creates a behaviour record with comment/followup encrypted at rest', async () => {
    const { school, schoolYear, student, teacher } = await setUp();

    const behaviour = await service.create(school.id, teacher.id, {
      schoolYearId: schoolYear.id,
      date: '2026-09-01',
      personId: student.id,
      type: 'Negative',
      comment: 'Disrupted class repeatedly',
      followup: 'Spoke with parents',
    });

    const rawRow = await dataSource
      .createQueryBuilder()
      .select([
        'behaviour.comment AS comment',
        'behaviour.followup AS followup',
      ])
      .from('behaviours', 'behaviour')
      .where('behaviour.id = :id', { id: behaviour.id })
      .getRawOne<{ comment: string; followup: string }>();
    expect(rawRow!.comment).not.toContain('Disrupted class');
    expect(rawRow!.followup).not.toContain('Spoke with parents');
  });

  describe("reproducing Gibbon's one good confidentiality mechanism", () => {
    it('hides level/comment/followup from the student themselves', async () => {
      const { school, schoolYear, student, teacher } = await setUp();
      const behaviour = await service.create(school.id, teacher.id, {
        schoolYearId: schoolYear.id,
        date: '2026-09-01',
        personId: student.id,
        type: 'Negative',
        level: 'Level 2',
        comment: 'Confidential',
        followup: 'Confidential',
      });
      const { role: studentRole } = await setUpRoleActor(school.id, 'Student');

      const view = await service.getVisibleBehaviour(
        school.id,
        behaviour.id,
        student.id,
        studentRole.id,
      );

      expect(view).not.toHaveProperty('comment');
      expect(view).not.toHaveProperty('followup');
      expect(view).not.toHaveProperty('level');
      expect(view.type).toBe('Negative');
    });

    it('hides level/comment/followup from a parent with childDataAccess', async () => {
      const { school, schoolYear, student, teacher } = await setUp();
      const behaviour = await service.create(school.id, teacher.id, {
        schoolYearId: schoolYear.id,
        date: '2026-09-01',
        personId: student.id,
        type: 'Negative',
        comment: 'Confidential',
      });
      const { role: parentRole, person: parent } = await setUpRoleActor(
        school.id,
        'Parent',
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

      const view = await service.getVisibleBehaviour(
        school.id,
        behaviour.id,
        parent.id,
        parentRole.id,
      );

      expect(view).not.toHaveProperty('comment');
    });

    it('shows level/comment/followup to Staff', async () => {
      const { school, schoolYear, student, teacher } = await setUp();
      const behaviour = await service.create(school.id, teacher.id, {
        schoolYearId: schoolYear.id,
        date: '2026-09-01',
        personId: student.id,
        type: 'Negative',
        level: 'Level 2',
        comment: 'Confidential',
        followup: 'Follow-up note',
      });
      const { role: staffRole } = await setUpRoleActor(school.id, 'Staff');

      const view = await service.getVisibleBehaviour(
        school.id,
        behaviour.id,
        teacher.id,
        staffRole.id,
      );

      expect(view).toHaveProperty('comment', 'Confidential');
      expect(view).toHaveProperty('level', 'Level 2');
    });

    it('denies an unrelated student outright, not just field-restricted', async () => {
      const { school, schoolYear, student, teacher } = await setUp();
      const behaviour = await service.create(school.id, teacher.id, {
        schoolYearId: schoolYear.id,
        date: '2026-09-01',
        personId: student.id,
        type: 'Negative',
      });
      const { role: strangerRole, person: stranger } = await setUpRoleActor(
        school.id,
        'Student',
      );

      await expect(
        service.getVisibleBehaviour(
          school.id,
          behaviour.id,
          stranger.id,
          strangerRole.id,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('denies a parent without childDataAccess', async () => {
      const { school, schoolYear, student, teacher } = await setUp();
      const behaviour = await service.create(school.id, teacher.id, {
        schoolYearId: schoolYear.id,
        date: '2026-09-01',
        personId: student.id,
        type: 'Negative',
      });
      const { role: parentRole, person: parent } = await setUpRoleActor(
        school.id,
        'Parent',
      );
      const family = await families.save(
        families.create({ schoolId: school.id, name: 'The Family' }),
      );
      await familyAdults.save(
        familyAdults.create({
          familyId: family.id,
          personId: parent.id,
          childDataAccess: false,
        }),
      );
      await familyChildren.save(
        familyChildren.create({ familyId: family.id, personId: student.id }),
      );

      await expect(
        service.getVisibleBehaviour(
          school.id,
          behaviour.id,
          parent.id,
          parentRole.id,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  it('throws NotFound updating a record belonging to a different school', async () => {
    const { school, schoolYear, student, teacher } = await setUp();
    const other = await setUp();
    const behaviour = await service.create(school.id, teacher.id, {
      schoolYearId: schoolYear.id,
      date: '2026-09-01',
      personId: student.id,
      type: 'Positive',
    });

    await expect(
      service.update(other.school.id, behaviour.id, { comment: 'Hijacked' }),
    ).rejects.toThrow(NotFoundException);
  });
});
