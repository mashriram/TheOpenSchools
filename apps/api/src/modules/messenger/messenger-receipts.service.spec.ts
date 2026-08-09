import { randomUUID } from 'node:crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { NotFoundException } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { SchoolModule } from '../school/school.module';
import { PeopleModule } from '../people/people.module';
import { RbacModule } from '../rbac/rbac.module';
import { MessengerModule } from './messenger.module';
import { SchoolsRepository } from '../school/repositories/schools.repository';
import { SchoolYearsRepository } from '../school/repositories/school-years.repository';
import { PeopleRepository } from '../people/repositories/people.repository';
import { MessengerService } from './messenger.service';
import { MessengerReceiptsService } from './messenger-receipts.service';

describe('MessengerReceiptsService (integration)', () => {
  let module: TestingModule;
  let schools: SchoolsRepository;
  let schoolYears: SchoolYearsRepository;
  let people: PeopleRepository;
  let messenger: MessengerService;
  let service: MessengerReceiptsService;
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
    schoolYears = module.get(SchoolYearsRepository);
    people = module.get(PeopleRepository);
    messenger = module.get(MessengerService);
    service = module.get(MessengerReceiptsService);
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

  async function setUpMessage() {
    const school = await schools.save(
      schools.create({ name: 'Test School', subdomainSlug: randomUUID() }),
    );
    createdSchoolIds.push(school.id);
    const schoolYear = await schoolYears.save(
      schoolYears.create({
        schoolId: school.id,
        name: '2024-25',
        sequenceNumber: 1,
      }),
    );
    const recipient = await people.save(
      people.create({
        schoolId: school.id,
        surname: 'Recipient',
        firstName: 'R',
      }),
    );
    const message = await messenger.create(school.id, null, {
      schoolYearId: schoolYear.id,
      subject: 'Hello',
      body: 'Body',
      targets: [{ targetType: 'Person', targetId: recipient.id }],
    });
    return { school, message, recipient };
  }

  it('confirms a recipient’s receipt', async () => {
    const { school, message, recipient } = await setUpMessage();

    const confirmed = await service.confirm(
      school.id,
      message.id,
      recipient.id,
    );

    expect(confirmed.confirmed).toBe(true);
    expect(confirmed.confirmedTimestamp).not.toBeNull();
  });

  it('throws 404 confirming a receipt for a person who was never targeted', async () => {
    const { school, message } = await setUpMessage();
    const bystander = await people.save(
      people.create({
        schoolId: school.id,
        surname: 'Bystander',
        firstName: 'B',
      }),
    );

    await expect(
      service.confirm(school.id, message.id, bystander.id),
    ).rejects.toThrow(NotFoundException);
  });

  it('lists receipts for a message', async () => {
    const { school, message, recipient } = await setUpMessage();

    const list = await service.list(school.id, message.id);

    expect(list).toEqual([expect.objectContaining({ personId: recipient.id })]);
  });
});
