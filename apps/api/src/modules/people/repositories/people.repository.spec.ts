import { randomUUID } from 'node:crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { QueryFailedError } from 'typeorm';
import { DatabaseModule } from '../../../database/database.module';
import { SchoolModule } from '../../school/school.module';
import { SchoolsRepository } from '../../school/repositories/schools.repository';
import { SchoolYearsRepository } from '../../school/repositories/school-years.repository';
import { RbacModule } from '../../rbac/rbac.module';
import { PeopleModule } from '../people.module';
import { PeopleRepository } from './people.repository';

describe('PeopleRepository (integration)', () => {
  let module: TestingModule;
  let schools: SchoolsRepository;
  let schoolYears: SchoolYearsRepository;
  let people: PeopleRepository;
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
    schoolYears = module.get(SchoolYearsRepository);
    people = module.get(PeopleRepository);
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(() => {
    createdSchoolIds = [];
  });

  afterEach(async () => {
    // Cascades to people (and everything hanging off a person).
    if (createdSchoolIds.length > 0) {
      await schools.delete(createdSchoolIds);
    }
  });

  async function createSchool() {
    const school = await schools.save(
      schools.create({ name: 'Test School', subdomainSlug: randomUUID() }),
    );
    createdSchoolIds.push(school.id);
    return school;
  }

  function buildPerson(
    schoolId: string,
    overrides: Record<string, unknown> = {},
  ) {
    return people.create({
      schoolId,
      surname: 'Smith',
      firstName: 'Jane',
      ...overrides,
    });
  }

  it('persists a person with sensible defaults', async () => {
    const school = await createSchool();

    const person = await people.save(buildPerson(school.id));

    expect(person.gender).toBe('Unspecified');
    expect(person.status).toBe('Full');
    expect(person.viewCalendarSchool).toBe(true);
    expect(person.receiveNotificationEmails).toBe(true);
    expect(person.houseId).toBeNull();
  });

  it('findByEmail finds a person scoped to their school', async () => {
    const school = await createSchool();
    const email = `${randomUUID()}@example.com`;
    await people.save(buildPerson(school.id, { email }));

    const found = await people.findByEmail(school.id, email);

    expect(found?.surname).toBe('Smith');
  });

  it('findByEmail returns null for another school even with the same email', async () => {
    const schoolA = await createSchool();
    const schoolB = await createSchool();
    const email = `${randomUUID()}@example.com`;
    await people.save(buildPerson(schoolA.id, { email }));

    expect(await people.findByEmail(schoolB.id, email)).toBeNull();
  });

  it('allows the same email to be reused across two different schools', async () => {
    const schoolA = await createSchool();
    const schoolB = await createSchool();
    const email = `${randomUUID()}@example.com`;
    await people.save(buildPerson(schoolA.id, { email }));

    const personB = await people.save(buildPerson(schoolB.id, { email }));

    expect(personB.email).toBe(email);
  });

  it('rejects two people with the same email in the same school', async () => {
    const school = await createSchool();
    const email = `${randomUUID()}@example.com`;
    await people.save(buildPerson(school.id, { email }));

    await expect(
      people.save(buildPerson(school.id, { email })),
    ).rejects.toThrow(QueryFailedError);
  });

  it('allows multiple people with no email (null does not collide) in the same school', async () => {
    const school = await createSchool();
    await people.save(buildPerson(school.id, { firstName: 'Alice' }));

    const second = await people.save(
      buildPerson(school.id, { firstName: 'Bob' }),
    );

    expect(second.email).toBeNull();
  });

  it('findBySchool returns every person for that school', async () => {
    const school = await createSchool();
    await people.save(buildPerson(school.id, { firstName: 'Alice' }));
    await people.save(buildPerson(school.id, { firstName: 'Bob' }));

    const found = await people.findBySchool(school.id);

    expect(found.map((p) => p.firstName).sort()).toEqual(['Alice', 'Bob']);
  });

  it('persists customFields as a real JSON object', async () => {
    const school = await createSchool();

    const person = await people.save(
      buildPerson(school.id, { customFields: { favoriteColor: 'blue' } }),
    );

    const reloaded = await people.findOne({ where: { id: person.id } });
    expect(reloaded?.customFields).toEqual({ favoriteColor: 'blue' });
  });

  it('sets classOfSchoolYearId to null (not cascade-deleted) when that school year is hard-deleted', async () => {
    const school = await createSchool();
    const year = await schoolYears.save(
      schoolYears.create({
        schoolId: school.id,
        name: '2025-2026',
        sequenceNumber: 1,
      }),
    );
    const person = await people.save(
      buildPerson(school.id, { classOfSchoolYearId: year.id }),
    );

    await schoolYears.delete(year.id);

    const reloaded = await people.findOne({ where: { id: person.id } });
    expect(reloaded?.classOfSchoolYearId).toBeNull();
  });

  it('cascade-deletes people when the parent school is hard-deleted', async () => {
    const school = await createSchool();
    const person = await people.save(buildPerson(school.id));

    await schools.delete(school.id);
    createdSchoolIds = createdSchoolIds.filter((id) => id !== school.id);

    expect(await people.findOne({ where: { id: person.id } })).toBeNull();
  });
});
