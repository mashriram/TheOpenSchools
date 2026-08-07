import { randomUUID } from 'node:crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../../../database/database.module';
import { SchoolModule } from '../../school/school.module';
import { SchoolsRepository } from '../../school/repositories/schools.repository';
import { RbacModule } from '../../rbac/rbac.module';
import { PeopleModule } from '../people.module';
import { PeopleRepository } from './people.repository';
import { PersonPhonesRepository } from './person-phones.repository';

describe('PersonPhonesRepository (integration)', () => {
  let module: TestingModule;
  let schools: SchoolsRepository;
  let people: PeopleRepository;
  let phones: PersonPhonesRepository;
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
    phones = module.get(PersonPhonesRepository);
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

  it('persists a phone with a default priority of 0', async () => {
    const person = await createPerson();

    const phone = await phones.save(
      phones.create({
        personId: person.id,
        type: 'Mobile',
        number: '555-0100',
      }),
    );

    expect(phone.priority).toBe(0);
  });

  it('findByPerson returns phones ordered by priority', async () => {
    const person = await createPerson();
    await phones.save(
      phones.create({
        personId: person.id,
        type: 'Home',
        number: '2',
        priority: 2,
      }),
    );
    await phones.save(
      phones.create({
        personId: person.id,
        type: 'Work',
        number: '0',
        priority: 0,
      }),
    );
    await phones.save(
      phones.create({
        personId: person.id,
        type: 'Mobile',
        number: '1',
        priority: 1,
      }),
    );

    const found = await phones.findByPerson(person.id);

    expect(found.map((p) => p.number)).toEqual(['0', '1', '2']);
  });

  it('findByPerson only returns phones for that person', async () => {
    const personA = await createPerson();
    const personB = await createPerson();
    await phones.save(
      phones.create({ personId: personA.id, type: 'Mobile', number: 'A' }),
    );
    await phones.save(
      phones.create({ personId: personB.id, type: 'Mobile', number: 'B' }),
    );

    const found = await phones.findByPerson(personA.id);

    expect(found).toHaveLength(1);
    expect(found[0].number).toBe('A');
  });

  it('cascade-deletes phones when the person is hard-deleted', async () => {
    const person = await createPerson();
    const phone = await phones.save(
      phones.create({
        personId: person.id,
        type: 'Mobile',
        number: '555-0100',
      }),
    );

    await people.delete(person.id);

    expect(await phones.findOne({ where: { id: phone.id } })).toBeNull();
  });
});
