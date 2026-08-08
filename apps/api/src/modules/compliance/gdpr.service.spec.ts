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
