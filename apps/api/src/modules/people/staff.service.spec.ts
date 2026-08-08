import { randomUUID } from 'node:crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { NotFoundException } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { PeopleModule } from './people.module';
import { SchoolModule } from '../school/school.module';
import { SchoolsRepository } from '../school/repositories/schools.repository';
import { PeopleService } from './people.service';
import { StaffService } from './staff.service';

describe('StaffService (integration)', () => {
  let module: TestingModule;
  let schools: SchoolsRepository;
  let people: PeopleService;
  let service: StaffService;
  let createdSchoolIds: string[];

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        DatabaseModule,
        SchoolModule,
        PeopleModule,
      ],
    }).compile();

    schools = module.get(SchoolsRepository);
    people = module.get(PeopleService);
    service = module.get(StaffService);
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
    const person = await people.create(school.id, {
      surname: 'Smith',
      firstName: 'Jo',
    });
    return { school, person };
  }

  it('creates a Staff profile on first upsert', async () => {
    const { school, person } = await createPerson();

    const staff = await service.upsert(school.id, person.id, {
      jobTitle: 'Teacher',
    });

    expect(staff.jobTitle).toBe('Teacher');
    expect(staff.personId).toBe(person.id);
  });

  it('updates the existing Staff profile on a second upsert (no duplicate row)', async () => {
    const { school, person } = await createPerson();
    await service.upsert(school.id, person.id, { jobTitle: 'Teacher' });

    const updated = await service.upsert(school.id, person.id, {
      jobTitle: 'Head Teacher',
    });

    expect(updated.jobTitle).toBe('Head Teacher');
    expect(await service.get(school.id, person.id)).not.toBeNull();
  });

  it('throws NotFound upserting for a person belonging to a different school', async () => {
    const { person } = await createPerson();
    const otherSchool = await schools.save(
      schools.create({ name: 'Other School', subdomainSlug: randomUUID() }),
    );
    createdSchoolIds.push(otherSchool.id);

    await expect(
      service.upsert(otherSchool.id, person.id, { jobTitle: 'Hijacked' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('removes a Staff profile', async () => {
    const { school, person } = await createPerson();
    await service.upsert(school.id, person.id, { jobTitle: 'Teacher' });

    await service.remove(school.id, person.id);

    expect(await service.get(school.id, person.id)).toBeNull();
  });

  it('throws NotFound removing a Staff profile that was never created', async () => {
    const { school, person } = await createPerson();

    await expect(service.remove(school.id, person.id)).rejects.toThrow(
      NotFoundException,
    );
  });
});
