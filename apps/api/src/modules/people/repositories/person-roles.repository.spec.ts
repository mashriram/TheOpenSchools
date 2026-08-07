import { randomUUID } from 'node:crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { QueryFailedError } from 'typeorm';
import { DatabaseModule } from '../../../database/database.module';
import { SchoolModule } from '../../school/school.module';
import { SchoolsRepository } from '../../school/repositories/schools.repository';
import { RbacModule } from '../../rbac/rbac.module';
import { RolesRepository } from '../../rbac/repositories/roles.repository';
import { PeopleModule } from '../people.module';
import { PeopleRepository } from './people.repository';
import { PersonRolesRepository } from './person-roles.repository';

describe('PersonRolesRepository (integration)', () => {
  let module: TestingModule;
  let schools: SchoolsRepository;
  let rbacRoles: RolesRepository;
  let people: PeopleRepository;
  let personRoles: PersonRolesRepository;
  let createdSchoolIds: string[];

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        DatabaseModule,
        SchoolModule,
        RbacModule,
        PeopleModule,
      ],
    }).compile();

    schools = module.get(SchoolsRepository);
    rbacRoles = module.get(RolesRepository);
    people = module.get(PeopleRepository);
    personRoles = module.get(PersonRolesRepository);
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(() => {
    createdSchoolIds = [];
  });

  afterEach(async () => {
    // Cascades to people + rbac_roles (and, transitively, person_roles).
    if (createdSchoolIds.length > 0) {
      await schools.delete(createdSchoolIds);
    }
  });

  async function createSchoolPersonAndRole() {
    const school = await schools.save(
      schools.create({ name: 'Test School', subdomainSlug: randomUUID() }),
    );
    createdSchoolIds.push(school.id);
    const person = await people.save(
      people.create({
        schoolId: school.id,
        surname: 'Smith',
        firstName: 'Jane',
      }),
    );
    const role = await rbacRoles.save(
      rbacRoles.create({
        schoolId: school.id,
        category: 'Staff',
        name: 'Administrator',
        shortName: 'Adm',
        description: 'Controls all aspects of the system',
        restriction: 'AdminOnly',
      }),
    );
    return { school, person, role };
  }

  it('persists a person-role link with isPrimary defaulting to false', async () => {
    const { person, role } = await createSchoolPersonAndRole();

    const link = await personRoles.save(
      personRoles.create({ personId: person.id, roleId: role.id }),
    );

    expect(link.isPrimary).toBe(false);
  });

  it('findByPerson loads the role relation', async () => {
    const { person, role } = await createSchoolPersonAndRole();
    await personRoles.save(
      personRoles.create({ personId: person.id, roleId: role.id }),
    );

    const found = await personRoles.findByPerson(person.id);

    expect(found[0].role.name).toBe('Administrator');
  });

  it('findPrimaryRole returns only the role marked primary', async () => {
    const { school, person, role } = await createSchoolPersonAndRole();
    const secondRole = await rbacRoles.save(
      rbacRoles.create({
        schoolId: school.id,
        category: 'Staff',
        name: 'Teacher',
        shortName: 'Tcr',
        description: 'Regular, classroom teacher',
        restriction: 'None',
      }),
    );
    await personRoles.save(
      personRoles.create({
        personId: person.id,
        roleId: role.id,
        isPrimary: false,
      }),
    );
    await personRoles.save(
      personRoles.create({
        personId: person.id,
        roleId: secondRole.id,
        isPrimary: true,
      }),
    );

    const primary = await personRoles.findPrimaryRole(person.id);

    expect(primary?.role.name).toBe('Teacher');
  });

  it('findPrimaryRole returns null when no role is marked primary', async () => {
    const { person, role } = await createSchoolPersonAndRole();
    await personRoles.save(
      personRoles.create({ personId: person.id, roleId: role.id }),
    );

    expect(await personRoles.findPrimaryRole(person.id)).toBeNull();
  });

  it('rejects assigning the same role to the same person twice', async () => {
    const { person, role } = await createSchoolPersonAndRole();
    await personRoles.save(
      personRoles.create({ personId: person.id, roleId: role.id }),
    );

    await expect(
      personRoles.save(
        personRoles.create({ personId: person.id, roleId: role.id }),
      ),
    ).rejects.toThrow(QueryFailedError);
  });

  it('allows a person to hold multiple different roles (multi-role support)', async () => {
    const { school, person, role } = await createSchoolPersonAndRole();
    const secondRole = await rbacRoles.save(
      rbacRoles.create({
        schoolId: school.id,
        category: 'Parent',
        name: 'Parent',
        shortName: 'Prt',
        description: 'Parent or guardian',
        restriction: 'None',
      }),
    );
    await personRoles.save(
      personRoles.create({ personId: person.id, roleId: role.id }),
    );
    await personRoles.save(
      personRoles.create({ personId: person.id, roleId: secondRole.id }),
    );

    const found = await personRoles.findByPerson(person.id);

    expect(found.map((pr) => pr.role.name).sort()).toEqual([
      'Administrator',
      'Parent',
    ]);
  });

  it('cascade-deletes the link when the person is hard-deleted', async () => {
    const { person, role } = await createSchoolPersonAndRole();
    const link = await personRoles.save(
      personRoles.create({ personId: person.id, roleId: role.id }),
    );

    await people.delete(person.id);

    expect(await personRoles.findOne({ where: { id: link.id } })).toBeNull();
  });

  it('cascade-deletes the link when the role is hard-deleted', async () => {
    const { person, role } = await createSchoolPersonAndRole();
    const link = await personRoles.save(
      personRoles.create({ personId: person.id, roleId: role.id }),
    );

    await rbacRoles.delete(role.id);

    expect(await personRoles.findOne({ where: { id: link.id } })).toBeNull();
  });
});
