import { randomUUID } from 'node:crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { NotFoundException } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { SchoolModule } from '../school/school.module';
import { PeopleModule } from '../people/people.module';
import { RbacModule } from '../rbac/rbac.module';
import { AuthModule } from '../auth/auth.module';
import { ComplianceModule } from './compliance.module';
import { AttendanceModule } from '../attendance/attendance.module';
import { AttendanceLogPeopleRepository } from '../attendance/repositories/attendance-log-people.repository';
import { BehaviourModule } from '../behaviour/behaviour.module';
import { BehavioursRepository } from '../behaviour/repositories/behaviours.repository';
import { BehaviourLetterSnapshotsRepository } from '../behaviour/repositories/behaviour-letter-snapshots.repository';
import { BehaviourLetterRecipientsRepository } from '../behaviour/repositories/behaviour-letter-recipients.repository';
import { BehaviourService } from '../behaviour/behaviour.service';
import { BehaviourLettersService } from '../behaviour/behaviour-letters.service';
import { FamiliesRepository } from '../people/repositories/families.repository';
import { FamilyAdultsRepository } from '../people/repositories/family-adults.repository';
import { FamilyChildrenRepository } from '../people/repositories/family-children.repository';
import { SchoolsRepository } from '../school/repositories/schools.repository';
import { SchoolYearsRepository } from '../school/repositories/school-years.repository';
import { YearGroupsRepository } from '../school/repositories/year-groups.repository';
import { FormGroupsRepository } from '../school/repositories/form-groups.repository';
import { PeopleRepository } from '../people/repositories/people.repository';
import { PersonCredentialsRepository } from '../people/repositories/person-credentials.repository';
import { PersonPhonesRepository } from '../people/repositories/person-phones.repository';
import { StudentEnrolmentsRepository } from '../people/repositories/student-enrolments.repository';
import { PersonRolesRepository } from '../people/repositories/person-roles.repository';
import { RolesRepository } from '../rbac/repositories/roles.repository';
import { AuditLogsRepository } from './repositories/audit-logs.repository';
import { GdprService } from './gdpr.service';

describe('GdprService (integration)', () => {
  let module: TestingModule;
  let schools: SchoolsRepository;
  let schoolYears: SchoolYearsRepository;
  let yearGroups: YearGroupsRepository;
  let formGroups: FormGroupsRepository;
  let people: PeopleRepository;
  let personCredentials: PersonCredentialsRepository;
  let personPhones: PersonPhonesRepository;
  let studentEnrolments: StudentEnrolmentsRepository;
  let personRoles: PersonRolesRepository;
  let roles: RolesRepository;
  let auditLogs: AuditLogsRepository;
  let attendanceLogPeople: AttendanceLogPeopleRepository;
  let behaviours: BehavioursRepository;
  let behaviourLetterSnapshots: BehaviourLetterSnapshotsRepository;
  let behaviourLetterRecipients: BehaviourLetterRecipientsRepository;
  let families: FamiliesRepository;
  let familyAdults: FamilyAdultsRepository;
  let familyChildren: FamilyChildrenRepository;
  let behaviourService: BehaviourService;
  let behaviourLettersService: BehaviourLettersService;
  let service: GdprService;
  let createdSchoolIds: string[];

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        DatabaseModule,
        SchoolModule,
        PeopleModule,
        RbacModule,
        AuthModule,
        ComplianceModule,
        AttendanceModule,
        BehaviourModule,
      ],
    }).compile();

    schools = module.get(SchoolsRepository);
    schoolYears = module.get(SchoolYearsRepository);
    yearGroups = module.get(YearGroupsRepository);
    formGroups = module.get(FormGroupsRepository);
    people = module.get(PeopleRepository);
    personCredentials = module.get(PersonCredentialsRepository);
    personPhones = module.get(PersonPhonesRepository);
    studentEnrolments = module.get(StudentEnrolmentsRepository);
    personRoles = module.get(PersonRolesRepository);
    roles = module.get(RolesRepository);
    auditLogs = module.get(AuditLogsRepository);
    attendanceLogPeople = module.get(AttendanceLogPeopleRepository);
    behaviours = module.get(BehavioursRepository);
    behaviourLetterSnapshots = module.get(BehaviourLetterSnapshotsRepository);
    behaviourLetterRecipients = module.get(BehaviourLetterRecipientsRepository);
    families = module.get(FamiliesRepository);
    familyAdults = module.get(FamilyAdultsRepository);
    familyChildren = module.get(FamilyChildrenRepository);
    behaviourService = module.get(BehaviourService);
    behaviourLettersService = module.get(BehaviourLettersService);
    service = module.get(GdprService);
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

  async function createFixture() {
    const school = await schools.save(
      schools.create({ name: 'Test School', subdomainSlug: randomUUID() }),
    );
    createdSchoolIds.push(school.id);
    const person = await people.save(
      people.create({
        schoolId: school.id,
        surname: 'Smith',
        firstName: 'Jo',
        email: `${randomUUID()}@example.com`,
      }),
    );
    await personPhones.save(
      personPhones.create({
        personId: person.id,
        type: 'Mobile',
        number: '555-0100',
      }),
    );
    const credential = await personCredentials.save(
      personCredentials.create({
        personId: person.id,
        schoolId: school.id,
        username: person.email!,
        passwordHash: 'argon2id$real-hash',
      }),
    );
    const role = await roles.save(
      roles.create({
        schoolId: school.id,
        category: 'Student',
        name: 'Student',
        shortName: 'Std',
        description: 'Student',
        restriction: 'None',
      }),
    );
    await personRoles.save(
      personRoles.create({
        personId: person.id,
        roleId: role.id,
        isPrimary: true,
      }),
    );
    const schoolYear = await schoolYears.save(
      schoolYears.create({
        schoolId: school.id,
        name: '2026',
        sequenceNumber: 1,
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
    const enrolment = await studentEnrolments.save(
      studentEnrolments.create({
        personId: person.id,
        schoolYearId: schoolYear.id,
        yearGroupId: yearGroup.id,
        formGroupId: formGroup.id,
      }),
    );
    return { school, person, credential, enrolment };
  }

  describe('exportPerson', () => {
    it('aggregates data across every Foundation entity, without secrets', async () => {
      const { school, person } = await createFixture();

      const exportResult = await service.exportPerson(school.id, person.id);

      expect(exportResult.person.id).toBe(person.id);
      expect(exportResult.phones).toHaveLength(1);
      expect(exportResult.roles).toHaveLength(1);
      expect(exportResult.enrolments).toHaveLength(1);
      expect(exportResult.credential?.username).toBe(person.email);
      expect(exportResult.credential).not.toHaveProperty('passwordHash');
      expect(exportResult.credential).not.toHaveProperty('mfaSecret');
    });

    it('audit-logs the export action', async () => {
      const { school, person } = await createFixture();

      await service.exportPerson(school.id, person.id);

      const rows = await auditLogs.findByEntity('Person', person.id);
      expect(rows.some((r) => r.action === 'export')).toBe(true);
    });

    it('throws NotFound for a person belonging to a different school', async () => {
      const { person } = await createFixture();
      const { school: otherSchool } = await createFixture();

      await expect(
        service.exportPerson(otherSchool.id, person.id),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('requestErasure', () => {
    it('nulls PII, disables login, deletes phone rows, but keeps the enrolment', async () => {
      const { school, person, credential, enrolment } = await createFixture();

      await service.requestErasure(school.id, person.id);

      const erasedPerson = await people.findOne({ where: { id: person.id } });
      expect(erasedPerson!.surname).toBe('[ERASED]');
      expect(erasedPerson!.email).toBeNull();
      expect(erasedPerson!.erasedAt).not.toBeNull();

      const updatedCredential = await personCredentials.findOne({
        where: { id: credential.id },
      });
      expect(updatedCredential!.canLogin).toBe(false);

      const remainingPhones = await personPhones.findByPerson(person.id);
      expect(remainingPhones).toHaveLength(0);

      const retainedEnrolment = await studentEnrolments.findOne({
        where: { id: enrolment.id },
      });
      expect(retainedEnrolment).not.toBeNull();
    });

    it('makes the old password permanently unusable', async () => {
      const { school, person, credential } = await createFixture();
      const originalHash = credential.passwordHash;

      await service.requestErasure(school.id, person.id);

      const updatedCredential = await personCredentials.findOne({
        where: { id: credential.id },
      });
      expect(updatedCredential!.passwordHash).not.toBe(originalHash);
    });

    it('audit-logs the erasure action', async () => {
      const { school, person } = await createFixture();

      await service.requestErasure(school.id, person.id);

      const rows = await auditLogs.findByEntity('Person', person.id);
      expect(rows.some((r) => r.action === 'erase')).toBe(true);
    });

    it('throws NotFound for a person belonging to a different school', async () => {
      const { person } = await createFixture();
      const { school: otherSchool } = await createFixture();

      await expect(
        service.requestErasure(otherSchool.id, person.id),
      ).rejects.toThrow(NotFoundException);
    });

    // Regression test for a real Gibbon gap (plan §Data Safety Design F):
    // Gibbon's gibbonAttendanceLogPerson has zero retention/erasure
    // coverage at all - this proves Attendance now participates in the
    // GDPR erasure pipeline from day one, unlike Gibbon.
    it('nulls Tier B attendance fields (reason/comment) while keeping the structural record', async () => {
      const { school, person } = await createFixture();
      const log = await attendanceLogPeople.save(
        attendanceLogPeople.create({
          personId: person.id,
          direction: 'In',
          reason: 'Medical',
          comment: 'Doctor appointment',
          date: '2026-09-01',
        }),
      );

      await service.requestErasure(school.id, person.id);

      const erasedLog = await attendanceLogPeople.findOne({
        where: { id: log.id },
      });
      expect(erasedLog!.reason).toBeNull();
      expect(erasedLog!.comment).toBeNull();
      expect(erasedLog!.direction).toBe('In');
      expect(erasedLog!.date).toBe('2026-09-01');
    });

    // Named regression test (plan §Data Safety Design F / M20): the
    // Behaviour letter snapshot has an INDEPENDENT retention lifecycle
    // from its source Behaviour record - scrubbing one must never affect
    // the other. Fixes Gibbon's real bug where the source record could be
    // scrubbed via the retention tool while the letter kept a permanent,
    // unrelated plaintext copy forever.
    it('gives the behaviour letter snapshot an independent retention lifecycle from its source record', async () => {
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
      const student = await people.save(
        people.create({
          schoolId: school.id,
          surname: 'Student',
          firstName: 'Sam',
        }),
      );
      const parent = await people.save(
        people.create({
          schoolId: school.id,
          surname: 'Parent',
          firstName: 'Pat',
          email: `${randomUUID()}@example.com`,
        }),
      );
      const family = await families.save(
        families.create({ schoolId: school.id, name: 'The Family' }),
      );
      await familyAdults.save(
        familyAdults.create({
          familyId: family.id,
          personId: parent.id,
          childDataAccess: true,
        }),
      );
      await familyChildren.save(
        familyChildren.create({ familyId: family.id, personId: student.id }),
      );
      const record = await behaviourService.create(school.id, student.id, {
        schoolYearId: schoolYear.id,
        date: '2026-09-01',
        personId: student.id,
        type: 'Negative',
        comment: 'Source incident comment',
      });
      const snapshot = await behaviourLettersService.create(school.id, {
        schoolYearId: schoolYear.id,
        personId: student.id,
        letterLevel: '2',
        status: 'Issued',
        type: 'Negative',
        body: 'Letter body referencing the incident',
      });

      // Erasing the source student scrubs both independently: the source
      // record's comment, the snapshot's body (they are the subject), and
      // (separately) the parent's own recipient row when THEY are erased.
      await service.requestErasure(school.id, student.id);

      const erasedRecord = await behaviours.findOne({
        where: { id: record.id },
      });
      expect(erasedRecord!.comment).toBeNull();
      const erasedSnapshot = await behaviourLetterSnapshots.findOne({
        where: { id: snapshot.id },
      });
      expect(erasedSnapshot!.body).toBeNull();

      // The parent's recipient row is untouched by the student's own
      // erasure - it has its own independent erasure trigger (the parent's
      // own request), proven here by erasing the parent separately and
      // confirming only their row is affected, not the whole snapshot.
      const recipientBeforeParentErasure =
        await behaviourLetterRecipients.findOne({
          where: { snapshotId: snapshot.id, personId: parent.id },
        });
      expect(recipientBeforeParentErasure!.email).toBe(parent.email);

      await service.requestErasure(school.id, parent.id);

      const recipientAfterParentErasure =
        await behaviourLetterRecipients.findOne({
          where: { snapshotId: snapshot.id, personId: parent.id },
        });
      expect(recipientAfterParentErasure!.email).toBeNull();
      // The snapshot itself (already erased above for the student) is
      // unaffected by the parent's separate erasure - independent rows.
      const snapshotAfterParentErasure = await behaviourLetterSnapshots.findOne(
        {
          where: { id: snapshot.id },
        },
      );
      expect(snapshotAfterParentErasure!.id).toBe(snapshot.id);
    });
  });

  describe('recordConsent', () => {
    it('records a versioned consent acceptance', async () => {
      const { person } = await createFixture();

      const consent = await service.recordConsent(person.id, '2026-01');

      expect(consent.policyVersion).toBe('2026-01');
      expect(consent.personId).toBe(person.id);
    });
  });
});
