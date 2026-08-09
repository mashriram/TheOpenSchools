import { randomUUID } from 'node:crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../../database/database.module';
import { SchoolModule } from '../school/school.module';
import { PeopleModule } from '../people/people.module';
import { RbacModule } from '../rbac/rbac.module';
import { MessengerModule } from './messenger.module';
import { SchoolsRepository } from '../school/repositories/schools.repository';
import { SchoolYearsRepository } from '../school/repositories/school-years.repository';
import { PeopleRepository } from '../people/repositories/people.repository';
import { SettingsRepository } from '../school/repositories/settings.repository';
import { MessengerService } from './messenger.service';
import { MessengersRepository } from './repositories/messengers.repository';
import { MessengerRetentionService } from './messenger-retention.service';

describe('MessengerRetentionService (integration)', () => {
  let module: TestingModule;
  let schools: SchoolsRepository;
  let schoolYears: SchoolYearsRepository;
  let people: PeopleRepository;
  let settings: SettingsRepository;
  let messenger: MessengerService;
  let messengers: MessengersRepository;
  let service: MessengerRetentionService;
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
    settings = module.get(SettingsRepository);
    messenger = module.get(MessengerService);
    messengers = module.get(MessengersRepository);
    service = module.get(MessengerRetentionService);
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

  async function setUpMessage(ageInMonths: number) {
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
      subject: 'Original subject',
      body: 'Original body',
      targets: [{ targetType: 'Person', targetId: recipient.id }],
    });
    const backdated = new Date();
    backdated.setMonth(backdated.getMonth() - ageInMonths);
    await messengers.update({ id: message.id }, { createdAt: backdated });
    return { school, message };
  }

  it('scrubs a message older than the configured retention window', async () => {
    const { school, message } = await setUpMessage(25);
    await settings.save(
      settings.create({
        schoolId: school.id,
        scope: 'Messenger',
        name: 'retentionWindowMonths',
        nameDisplay: 'Message Retention Window (months)',
        value: '24',
      }),
    );

    const scrubbedCount = await service.scrubExpiredMessages(school.id);

    expect(scrubbedCount).toBe(1);
    const scrubbed = await messengers.findOne({ where: { id: message.id } });
    expect(scrubbed!.subject).not.toBe('Original subject');
    expect(scrubbed!.body).not.toBe('Original body');
  });

  it('leaves a message within the retention window untouched', async () => {
    const { school, message } = await setUpMessage(1);
    await settings.save(
      settings.create({
        schoolId: school.id,
        scope: 'Messenger',
        name: 'retentionWindowMonths',
        nameDisplay: 'Message Retention Window (months)',
        value: '24',
      }),
    );

    const scrubbedCount = await service.scrubExpiredMessages(school.id);

    expect(scrubbedCount).toBe(0);
    const untouched = await messengers.findOne({ where: { id: message.id } });
    expect(untouched!.subject).toBe('Original subject');
  });

  it('does nothing when no retention window is configured (absence disables scrubbing, not maximizes it)', async () => {
    const { school, message } = await setUpMessage(120);

    const scrubbedCount = await service.scrubExpiredMessages(school.id);

    expect(scrubbedCount).toBe(0);
    const untouched = await messengers.findOne({ where: { id: message.id } });
    expect(untouched!.subject).toBe('Original subject');
  });
});
