import { randomUUID } from 'node:crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { SchoolModule } from '../school/school.module';
import { PeopleModule } from '../people/people.module';
import { RbacModule } from '../rbac/rbac.module';
import { MessengerModule } from './messenger.module';
import { SchoolsRepository } from '../school/repositories/schools.repository';
import { SchoolYearsRepository } from '../school/repositories/school-years.repository';
import { YearGroupsRepository } from '../school/repositories/year-groups.repository';
import { FormGroupsRepository } from '../school/repositories/form-groups.repository';
import { HousesRepository } from '../school/repositories/houses.repository';
import { PeopleRepository } from '../people/repositories/people.repository';
import { StudentEnrolmentsRepository } from '../people/repositories/student-enrolments.repository';
import { PersonRolesRepository } from '../people/repositories/person-roles.repository';
import { RolesRepository } from '../rbac/repositories/roles.repository';
import { MessengerService } from './messenger.service';
import { MessengerTargetsRepository } from './repositories/messenger-targets.repository';
import { MessengerReceiptsRepository } from './repositories/messenger-receipts.repository';

describe('MessengerService (integration)', () => {
  let module: TestingModule;
  let schools: SchoolsRepository;
  let schoolYears: SchoolYearsRepository;
  let yearGroups: YearGroupsRepository;
  let formGroups: FormGroupsRepository;
  let houses: HousesRepository;
  let people: PeopleRepository;
  let studentEnrolments: StudentEnrolmentsRepository;
  let personRoles: PersonRolesRepository;
  let roles: RolesRepository;
  let service: MessengerService;
  let targets: MessengerTargetsRepository;
  let receipts: MessengerReceiptsRepository;
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
    yearGroups = module.get(YearGroupsRepository);
    formGroups = module.get(FormGroupsRepository);
    houses = module.get(HousesRepository);
    people = module.get(PeopleRepository);
    studentEnrolments = module.get(StudentEnrolmentsRepository);
    personRoles = module.get(PersonRolesRepository);
    roles = module.get(RolesRepository);
    service = module.get(MessengerService);
    targets = module.get(MessengerTargetsRepository);
    receipts = module.get(MessengerReceiptsRepository);
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
    const schoolYear = await schoolYears.save(
      schoolYears.create({
        schoolId: school.id,
        name: '2024-25',
        sequenceNumber: 1,
      }),
    );
    return { school, schoolYear };
  }

  it('resolves a Person target to a single receipt with a snapshotted name', async () => {
    const { school, schoolYear } = await setUpSchool();
    const recipient = await people.save(
      people.create({
        schoolId: school.id,
        surname: 'Recipient',
        firstName: 'R',
      }),
    );

    const message = await service.create(school.id, null, {
      schoolYearId: schoolYear.id,
      subject: 'Hello',
      body: 'A test message',
      targets: [{ targetType: 'Person', targetId: recipient.id }],
    });

    const receiptRows = await receipts.findByMessenger(message.id);
    expect(receiptRows).toEqual([
      expect.objectContaining({
        personId: recipient.id,
        recipientName: 'R Recipient',
      }),
    ]);
  });

  it('resolves a Role target to every person holding that role', async () => {
    const { school, schoolYear } = await setUpSchool();
    const role = await roles.save(
      roles.create({
        schoolId: school.id,
        category: 'Staff',
        name: randomUUID(),
        shortName: 'STF',
        description: 'test role',
        restriction: 'None',
      }),
    );
    const staff = await people.save(
      people.create({ schoolId: school.id, surname: 'Staff', firstName: 'S' }),
    );
    await personRoles.save(
      personRoles.create({
        personId: staff.id,
        roleId: role.id,
        isPrimary: true,
      }),
    );

    const message = await service.create(school.id, null, {
      schoolYearId: schoolYear.id,
      subject: 'Staff meeting',
      body: 'Please attend',
      targets: [{ targetType: 'Role', targetId: role.id }],
    });

    const receiptRows = await receipts.findByMessenger(message.id);
    expect(receiptRows.map((r) => r.personId)).toEqual([staff.id]);
  });

  it('resolves a YearGroup target scoped to the given school year only', async () => {
    const { school, schoolYear } = await setUpSchool();
    const otherSchoolYear = await schoolYears.save(
      schoolYears.create({
        schoolId: school.id,
        name: '2025-26',
        sequenceNumber: 2,
      }),
    );
    const yearGroup = await yearGroups.save(
      yearGroups.create({
        schoolId: school.id,
        name: 'Year 7',
        shortName: 'Y7',
        sequenceNumber: 7,
      }),
    );
    const formGroup = await formGroups.save(
      formGroups.create({
        schoolYearId: schoolYear.id,
        name: '7A',
        shortName: '7A',
      }),
    );
    const otherYearFormGroup = await formGroups.save(
      formGroups.create({
        schoolYearId: otherSchoolYear.id,
        name: '7A-next',
        shortName: '7An',
      }),
    );
    const studentThisYear = await people.save(
      people.create({
        schoolId: school.id,
        surname: 'ThisYear',
        firstName: 'T',
      }),
    );
    const studentOtherYear = await people.save(
      people.create({
        schoolId: school.id,
        surname: 'OtherYear',
        firstName: 'O',
      }),
    );
    await studentEnrolments.save(
      studentEnrolments.create({
        personId: studentThisYear.id,
        schoolYearId: schoolYear.id,
        yearGroupId: yearGroup.id,
        formGroupId: formGroup.id,
      }),
    );
    await studentEnrolments.save(
      studentEnrolments.create({
        personId: studentOtherYear.id,
        schoolYearId: otherSchoolYear.id,
        yearGroupId: yearGroup.id,
        formGroupId: otherYearFormGroup.id,
      }),
    );

    const message = await service.create(school.id, null, {
      schoolYearId: schoolYear.id,
      subject: 'Year 7 notice',
      body: 'Notice for this year only',
      targets: [{ targetType: 'YearGroup', targetId: yearGroup.id }],
    });

    const receiptRows = await receipts.findByMessenger(message.id);
    expect(receiptRows.map((r) => r.personId)).toEqual([studentThisYear.id]);
  });

  it('resolves a House target to every person assigned to that house', async () => {
    const { school, schoolYear } = await setUpSchool();
    const house = await houses.save(
      houses.create({
        schoolId: school.id,
        name: 'Red House',
        shortName: 'RED',
      }),
    );
    const member = await people.save(
      people.create({
        schoolId: school.id,
        surname: 'Member',
        firstName: 'M',
        houseId: house.id,
      }),
    );

    const message = await service.create(school.id, null, {
      schoolYearId: schoolYear.id,
      subject: 'House notice',
      body: 'Go team',
      targets: [{ targetType: 'House', targetId: house.id }],
    });

    const receiptRows = await receipts.findByMessenger(message.id);
    expect(receiptRows.map((r) => r.personId)).toEqual([member.id]);
  });

  it('dedupes a person reachable through two overlapping targets', async () => {
    const { school, schoolYear } = await setUpSchool();
    const house = await houses.save(
      houses.create({
        schoolId: school.id,
        name: 'Red House',
        shortName: 'RED',
      }),
    );
    const member = await people.save(
      people.create({
        schoolId: school.id,
        surname: 'Member',
        firstName: 'M',
        houseId: house.id,
      }),
    );

    const message = await service.create(school.id, null, {
      schoolYearId: schoolYear.id,
      subject: 'Overlap',
      body: 'Body',
      targets: [
        { targetType: 'House', targetId: house.id },
        { targetType: 'Person', targetId: member.id },
      ],
    });

    const receiptRows = await receipts.findByMessenger(message.id);
    expect(receiptRows).toHaveLength(1);
  });

  it('rejects a target belonging to another school', async () => {
    const { school, schoolYear } = await setUpSchool();
    const { school: otherSchool } = await setUpSchool();
    const stranger = await people.save(
      people.create({
        schoolId: otherSchool.id,
        surname: 'Stranger',
        firstName: 'S',
      }),
    );

    await expect(
      service.create(school.id, null, {
        schoolYearId: schoolYear.id,
        subject: 'Hello',
        body: 'Body',
        targets: [{ targetType: 'Person', targetId: stranger.id }],
      }),
    ).rejects.toThrow(BadRequestException);
  });

  // Named regression test (plan §Gibbon facts, Messenger / M23): Gibbon's
  // real gibbonMessenger DELETE has no FK to cascade to
  // gibbonMessengerReceipt/gibbonMessengerTarget, so those rows are
  // orphaned forever. Proves the real FK fix: deleting a message here
  // leaves zero orphaned target/receipt rows.
  it('leaves zero orphaned MessengerTarget/MessengerReceipt rows when a message is deleted', async () => {
    const { school, schoolYear } = await setUpSchool();
    const recipient = await people.save(
      people.create({
        schoolId: school.id,
        surname: 'Recipient',
        firstName: 'R',
      }),
    );
    const message = await service.create(school.id, null, {
      schoolYearId: schoolYear.id,
      subject: 'Hello',
      body: 'Body',
      targets: [{ targetType: 'Person', targetId: recipient.id }],
    });
    expect(await targets.findByMessenger(message.id)).toHaveLength(1);
    expect(await receipts.findByMessenger(message.id)).toHaveLength(1);

    await service.remove(school.id, message.id);

    expect(await targets.findByMessenger(message.id)).toHaveLength(0);
    expect(await receipts.findByMessenger(message.id)).toHaveLength(0);
  });
});
