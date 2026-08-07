import { randomUUID } from 'node:crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../../../database/database.module';
import { SchoolModule } from '../../school/school.module';
import { SchoolsRepository } from '../../school/repositories/schools.repository';
import { RbacModule } from '../../rbac/rbac.module';
import { PeopleModule } from '../people.module';
import { PeopleRepository } from './people.repository';
import { PersonEmergencyContactsRepository } from './person-emergency-contacts.repository';

describe('PersonEmergencyContactsRepository (integration)', () => {
  let module: TestingModule;
  let schools: SchoolsRepository;
  let people: PeopleRepository;
  let contacts: PersonEmergencyContactsRepository;
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
    people = module.get(PeopleRepository);
    contacts = module.get(PersonEmergencyContactsRepository);
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

  async function createPerson() {
    const school = await schools.save(
      schools.create({ name: 'Test School', subdomainSlug: randomUUID() }),
    );
    createdSchoolIds.push(school.id);
    return people.save(
      people.create({
        schoolId: school.id,
        surname: 'Smith',
        firstName: 'Jane',
      }),
    );
  }

  it('persists an emergency contact with a default priority of 0', async () => {
    const person = await createPerson();

    const contact = await contacts.save(
      contacts.create({ personId: person.id, name: 'John Smith' }),
    );

    expect(contact.priority).toBe(0);
  });

  it('findByPerson returns contacts ordered by priority', async () => {
    const person = await createPerson();
    await contacts.save(
      contacts.create({ personId: person.id, name: 'Second', priority: 1 }),
    );
    await contacts.save(
      contacts.create({ personId: person.id, name: 'First', priority: 0 }),
    );

    const found = await contacts.findByPerson(person.id);

    expect(found.map((c) => c.name)).toEqual(['First', 'Second']);
  });

  it('cascade-deletes emergency contacts when the person is hard-deleted', async () => {
    const person = await createPerson();
    const contact = await contacts.save(
      contacts.create({ personId: person.id, name: 'John Smith' }),
    );

    await people.delete(person.id);

    expect(await contacts.findOne({ where: { id: contact.id } })).toBeNull();
  });
});
