import { randomUUID } from 'node:crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { SchoolModule } from '../school/school.module';
import { PeopleModule } from '../people/people.module';
import { RbacModule } from '../rbac/rbac.module';
import { MessengerModule } from './messenger.module';
import { SchoolsRepository } from '../school/repositories/schools.repository';
import { PeopleRepository } from '../people/repositories/people.repository';
import { MessengerMailingListsService } from './messenger-mailing-lists.service';

describe('MessengerMailingListsService (integration)', () => {
  let module: TestingModule;
  let schools: SchoolsRepository;
  let people: PeopleRepository;
  let service: MessengerMailingListsService;
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
    people = module.get(PeopleRepository);
    service = module.get(MessengerMailingListsService);
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

  it('creates, lists, and adds a recipient to a mailing list', async () => {
    const { school } = await setUpSchool();
    const person = await people.save(
      people.create({ schoolId: school.id, surname: 'Person', firstName: 'P' }),
    );

    const mailingList = await service.create(school.id, { name: 'Parents' });
    await service.addRecipient(school.id, mailingList.id, person.id);

    const list = await service.list(school.id);
    expect(list).toEqual([expect.objectContaining({ id: mailingList.id })]);
    const recipients = await service.listRecipients(school.id, mailingList.id);
    expect(recipients).toEqual([
      expect.objectContaining({ personId: person.id }),
    ]);
  });

  it('rejects a duplicate mailing list name within the same school', async () => {
    const { school } = await setUpSchool();
    await service.create(school.id, { name: 'Parents' });

    await expect(
      service.create(school.id, { name: 'Parents' }),
    ).rejects.toThrow(ConflictException);
  });

  it('rejects adding a recipient whose person belongs to another school', async () => {
    const { school } = await setUpSchool();
    const mailingList = await service.create(school.id, { name: 'Parents' });
    const { school: otherSchool } = await setUpSchool();
    const stranger = await people.save(
      people.create({
        schoolId: otherSchool.id,
        surname: 'Stranger',
        firstName: 'S',
      }),
    );

    await expect(
      service.addRecipient(school.id, mailingList.id, stranger.id),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects adding the same recipient twice', async () => {
    const { school } = await setUpSchool();
    const mailingList = await service.create(school.id, { name: 'Parents' });
    const person = await people.save(
      people.create({ schoolId: school.id, surname: 'Person', firstName: 'P' }),
    );
    await service.addRecipient(school.id, mailingList.id, person.id);

    await expect(
      service.addRecipient(school.id, mailingList.id, person.id),
    ).rejects.toThrow(ConflictException);
  });

  it('throws 404 for a mailing list from another school', async () => {
    const { school } = await setUpSchool();
    const mailingList = await service.create(school.id, { name: 'Parents' });
    const { school: otherSchool } = await setUpSchool();

    await expect(
      service.remove(otherSchool.id, mailingList.id),
    ).rejects.toThrow(NotFoundException);
  });
});
