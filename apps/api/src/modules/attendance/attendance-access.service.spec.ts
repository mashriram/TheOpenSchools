import { randomUUID } from 'node:crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { ForbiddenException } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { SchoolModule } from '../school/school.module';
import { PeopleModule } from '../people/people.module';
import { CurriculumModule } from '../curriculum/curriculum.module';
import { RbacModule } from '../rbac/rbac.module';
import { AttendanceModule } from './attendance.module';
import { SchoolsRepository } from '../school/repositories/schools.repository';
import { RolesRepository } from '../rbac/repositories/roles.repository';
import { PeopleRepository } from '../people/repositories/people.repository';
import { FamiliesRepository } from '../people/repositories/families.repository';
import { FamilyAdultsRepository } from '../people/repositories/family-adults.repository';
import { FamilyChildrenRepository } from '../people/repositories/family-children.repository';
import { AttendanceAccessService } from './attendance-access.service';

describe('AttendanceAccessService (integration)', () => {
  let module: TestingModule;
  let schools: SchoolsRepository;
  let roles: RolesRepository;
  let people: PeopleRepository;
  let families: FamiliesRepository;
  let familyAdults: FamilyAdultsRepository;
  let familyChildren: FamilyChildrenRepository;
  let service: AttendanceAccessService;
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
        AttendanceModule,
      ],
    }).compile();

    schools = module.get(SchoolsRepository);
    roles = module.get(RolesRepository);
    people = module.get(PeopleRepository);
    families = module.get(FamiliesRepository);
    familyAdults = module.get(FamilyAdultsRepository);
    familyChildren = module.get(FamilyChildrenRepository);
    service = module.get(AttendanceAccessService);
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

  it('always allows viewing your own attendance regardless of role', async () => {
    const { school, student } = await setUp();
    const { role } = await setUpRoleActor(school.id, 'Student');

    await expect(
      service.assertCanViewAttendance(student.id, role.id, student.id),
    ).resolves.toBeUndefined();
  });

  it('allows Staff to view any person’s attendance in the school', async () => {
    const { school, student } = await setUp();
    const { role, person: staff } = await setUpRoleActor(school.id, 'Staff');

    await expect(
      service.assertCanViewAttendance(staff.id, role.id, student.id),
    ).resolves.toBeUndefined();
  });

  it('forbids a Student from viewing another student’s attendance', async () => {
    const { school, student } = await setUp();
    const { role, person: otherStudent } = await setUpRoleActor(
      school.id,
      'Student',
    );

    await expect(
      service.assertCanViewAttendance(otherStudent.id, role.id, student.id),
    ).rejects.toThrow(ForbiddenException);
  });

  it('allows a Parent with childDataAccess to view their child’s attendance', async () => {
    const { school, student } = await setUp();
    const { role, person: parent } = await setUpRoleActor(school.id, 'Parent');
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

    await expect(
      service.assertCanViewAttendance(parent.id, role.id, student.id),
    ).resolves.toBeUndefined();
  });

  it('forbids a Parent without childDataAccess from viewing the child’s attendance', async () => {
    const { school, student } = await setUp();
    const { role, person: parent } = await setUpRoleActor(school.id, 'Parent');
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
      service.assertCanViewAttendance(parent.id, role.id, student.id),
    ).rejects.toThrow(ForbiddenException);
  });

  it('forbids a Parent from viewing an unrelated child’s attendance', async () => {
    const { school, student } = await setUp();
    const { role, person: parent } = await setUpRoleActor(school.id, 'Parent');

    await expect(
      service.assertCanViewAttendance(parent.id, role.id, student.id),
    ).rejects.toThrow(ForbiddenException);
  });
});
