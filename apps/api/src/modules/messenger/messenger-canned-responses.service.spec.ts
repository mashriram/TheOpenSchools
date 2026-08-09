import { randomUUID } from 'node:crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { SchoolModule } from '../school/school.module';
import { PeopleModule } from '../people/people.module';
import { RbacModule } from '../rbac/rbac.module';
import { MessengerModule } from './messenger.module';
import { SchoolsRepository } from '../school/repositories/schools.repository';
import { MessengerCannedResponsesService } from './messenger-canned-responses.service';

describe('MessengerCannedResponsesService (integration)', () => {
  let module: TestingModule;
  let schools: SchoolsRepository;
  let service: MessengerCannedResponsesService;
  let createdSchoolIds: string[];

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        DatabaseModule,
        SchoolModule,
        PeopleModule,
        RbacModule,
        MessengerModule,
      ],
    }).compile();

    schools = module.get(SchoolsRepository);
    service = module.get(MessengerCannedResponsesService);
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

  async function setUpSchool() {
    const school = await schools.save(
      schools.create({ name: 'Test School', subdomainSlug: randomUUID() }),
    );
    createdSchoolIds.push(school.id);
    return { school };
  }

  it('creates, lists, and updates a canned response', async () => {
    const { school } = await setUpSchool();

    const created = await service.create(school.id, {
      name: 'Absence follow-up',
      body: 'Please let us know the reason for absence.',
    });
    const list = await service.list(school.id);
    expect(list).toEqual([expect.objectContaining({ id: created.id })]);

    const updated = await service.update(school.id, created.id, {
      body: 'Updated body text.',
    });
    expect(updated.body).toBe('Updated body text.');
  });

  it('rejects a duplicate canned response name within the same school', async () => {
    const { school } = await setUpSchool();
    await service.create(school.id, { name: 'Template', body: 'Body' });

    await expect(
      service.create(school.id, { name: 'Template', body: 'Other body' }),
    ).rejects.toThrow(ConflictException);
  });

  it('throws 404 for a canned response from another school', async () => {
    const { school } = await setUpSchool();
    const created = await service.create(school.id, {
      name: 'Template',
      body: 'Body',
    });
    const { school: otherSchool } = await setUpSchool();

    await expect(service.remove(otherSchool.id, created.id)).rejects.toThrow(
      NotFoundException,
    );
  });
});
