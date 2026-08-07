import { randomUUID } from 'node:crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { QueryFailedError } from 'typeorm';
import { DatabaseModule } from '../../../database/database.module';
import { SchoolModule } from '../../school/school.module';
import { SchoolsRepository } from '../../school/repositories/schools.repository';
import { RbacModule } from '../../rbac/rbac.module';
import { PeopleModule } from '../people.module';
import { PeopleRepository } from './people.repository';
import { PersonCredentialsRepository } from './person-credentials.repository';

describe('PersonCredentialsRepository (integration)', () => {
  let module: TestingModule;
  let schools: SchoolsRepository;
  let people: PeopleRepository;
  let credentials: PersonCredentialsRepository;
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
    credentials = module.get(PersonCredentialsRepository);
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

  function createPersonInSchool(schoolId: string) {
    return people.save(
      people.create({ schoolId, surname: 'Doe', firstName: 'John' }),
    );
  }

  function buildCredential(
    person: { id: string; schoolId: string },
    overrides = {},
  ) {
    return credentials.create({
      personId: person.id,
      schoolId: person.schoolId,
      username: randomUUID(),
      passwordHash: 'hashed-password',
      ...overrides,
    });
  }

  it('persists a credential with sensible defaults', async () => {
    const person = await createPerson();

    const credential = await credentials.save(buildCredential(person));

    expect(credential.canLogin).toBe(true);
    expect(credential.passwordForceReset).toBe(false);
    expect(credential.mfaEnabled).toBe(false);
    expect(credential.failedLoginCount).toBe(0);
  });

  it('findByPersonId finds the credential for that person', async () => {
    const person = await createPerson();
    await credentials.save(buildCredential(person, { username: 'jane.smith' }));

    const found = await credentials.findByPersonId(person.id);

    expect(found?.username).toBe('jane.smith');
  });

  it('findByUsername finds a credential scoped to the school', async () => {
    const person = await createPerson();
    await credentials.save(buildCredential(person, { username: 'jane.smith' }));

    const found = await credentials.findByUsername(
      person.schoolId,
      'jane.smith',
    );

    expect(found?.personId).toBe(person.id);
  });

  it('rejects a second credential for the same person (1:1)', async () => {
    const person = await createPerson();
    await credentials.save(buildCredential(person));

    await expect(credentials.save(buildCredential(person))).rejects.toThrow(
      QueryFailedError,
    );
  });

  it('rejects a duplicate username within the same school', async () => {
    const person = await createPerson();
    await credentials.save(buildCredential(person, { username: 'jane.smith' }));
    const otherPerson = await createPersonInSchool(person.schoolId);

    await expect(
      credentials.save(
        buildCredential(otherPerson, { username: 'jane.smith' }),
      ),
    ).rejects.toThrow(QueryFailedError);
  });

  it('allows the same username across two different schools', async () => {
    const personA = await createPerson();
    const personB = await createPerson();

    await credentials.save(buildCredential(personA, { username: 'admin' }));
    const credentialB = await credentials.save(
      buildCredential(personB, { username: 'admin' }),
    );

    expect(credentialB.username).toBe('admin');
  });

  it('cascade-deletes the credential when the person is hard-deleted', async () => {
    const person = await createPerson();
    const credential = await credentials.save(buildCredential(person));

    await people.delete(person.id);

    expect(
      await credentials.findOne({ where: { id: credential.id } }),
    ).toBeNull();
  });
});
