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
import { PersonOAuthConnectionsRepository } from './person-oauth-connections.repository';

describe('PersonOAuthConnectionsRepository (integration)', () => {
  let module: TestingModule;
  let schools: SchoolsRepository;
  let people: PeopleRepository;
  let connections: PersonOAuthConnectionsRepository;
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
    connections = module.get(PersonOAuthConnectionsRepository);
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

  it('persists an OAuth connection', async () => {
    const person = await createPerson();

    const connection = await connections.save(
      connections.create({
        personId: person.id,
        provider: 'Google',
        refreshToken: 'token',
      }),
    );

    expect(connection.provider).toBe('Google');
  });

  it('findByPersonAndProvider finds the matching connection', async () => {
    const person = await createPerson();
    await connections.save(
      connections.create({
        personId: person.id,
        provider: 'Microsoft',
        refreshToken: 'token',
      }),
    );

    const found = await connections.findByPersonAndProvider(
      person.id,
      'Microsoft',
    );

    expect(found?.refreshToken).toBe('token');
  });

  it('returns null for a provider the person has not connected', async () => {
    const person = await createPerson();

    expect(
      await connections.findByPersonAndProvider(person.id, 'Google'),
    ).toBeNull();
  });

  it('allows the same person to connect two different providers', async () => {
    const person = await createPerson();
    await connections.save(
      connections.create({
        personId: person.id,
        provider: 'Google',
        refreshToken: 'g',
      }),
    );

    const microsoft = await connections.save(
      connections.create({
        personId: person.id,
        provider: 'Microsoft',
        refreshToken: 'm',
      }),
    );

    expect(microsoft.provider).toBe('Microsoft');
  });

  it('rejects connecting the same provider twice for the same person', async () => {
    const person = await createPerson();
    await connections.save(
      connections.create({
        personId: person.id,
        provider: 'Google',
        refreshToken: 'g1',
      }),
    );

    await expect(
      connections.save(
        connections.create({
          personId: person.id,
          provider: 'Google',
          refreshToken: 'g2',
        }),
      ),
    ).rejects.toThrow(QueryFailedError);
  });

  it('cascade-deletes connections when the person is hard-deleted', async () => {
    const person = await createPerson();
    const connection = await connections.save(
      connections.create({
        personId: person.id,
        provider: 'Google',
        refreshToken: 'token',
      }),
    );

    await people.delete(person.id);

    expect(
      await connections.findOne({ where: { id: connection.id } }),
    ).toBeNull();
  });
});
