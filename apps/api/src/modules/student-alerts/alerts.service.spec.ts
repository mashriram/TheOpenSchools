import { randomUUID } from 'node:crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { AbilityBuilder, createMongoAbility } from '@casl/ability';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { DatabaseModule } from '../../database/database.module';
import { SchoolModule } from '../school/school.module';
import { PeopleModule } from '../people/people.module';
import { CurriculumModule } from '../curriculum/curriculum.module';
import { RbacModule } from '../rbac/rbac.module';
import { StudentAlertsModule } from './student-alerts.module';
import { SchoolsRepository } from '../school/repositories/schools.repository';
import { SchoolYearsRepository } from '../school/repositories/school-years.repository';
import { PeopleRepository } from '../people/repositories/people.repository';
import type { AppAbility } from '../rbac/casl-ability.factory';
import { AlertTypesService } from './alert-types.service';
import { AlertsService } from './alerts.service';

function buildAbility(
  configure: (builder: AbilityBuilder<AppAbility>) => void,
): AppAbility {
  const builder = new AbilityBuilder<AppAbility>(createMongoAbility);
  configure(builder);
  return builder.build();
}

type ConditionalCanBuilder = (
  verb: string,
  subjectType: string,
  conditions: Record<string, unknown>,
) => void;

// Mirrors casl-ability.factory.ts's documented cast: AppAbility's subject
// slot is plain `string` (free-text catalog design), so passing conditions
// to `can()` needs this same narrow, accepted type-level workaround.
function canWithConditions(
  can: AbilityBuilder<AppAbility>['can'],
  verb: string,
  subjectType: string,
  conditions: Record<string, unknown>,
): void {
  (can as unknown as ConditionalCanBuilder)(verb, subjectType, conditions);
}

/** Mirrors the Admin role's real default grants from student-alerts-rbac-catalog.ts. */
function buildAdminAbility(): AppAbility {
  return buildAbility(({ can }) => {
    can('manage', 'AlertType');
    can('manage', 'Alert');
    can('view', 'Alert');
  });
}

/**
 * Mirrors the default Teacher role's real grants: only the conditioned
 * `viewNonRestricted`/`manage` (non-admin-only) actions, never the
 * unconditioned ones.
 */
function buildTeacherAbility(): AppAbility {
  return buildAbility(({ can }) => {
    canWithConditions(can, 'manage', 'Alert', { alertTypeAdminOnly: false });
    canWithConditions(can, 'view', 'Alert', { alertTypeAdminOnly: false });
  });
}

describe('AlertsService (integration)', () => {
  let module: TestingModule;
  let dataSource: DataSource;
  let schools: SchoolsRepository;
  let schoolYears: SchoolYearsRepository;
  let people: PeopleRepository;
  let alertTypes: AlertTypesService;
  let service: AlertsService;
  let createdSchoolIds: string[];

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        DatabaseModule,
        SchoolModule,
        PeopleModule,
        CurriculumModule,
        RbacModule,
        StudentAlertsModule,
      ],
    }).compile();

    dataSource = module.get(DataSource);
    schools = module.get(SchoolsRepository);
    schoolYears = module.get(SchoolYearsRepository);
    people = module.get(PeopleRepository);
    alertTypes = module.get(AlertTypesService);
    service = module.get(AlertsService);
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

  async function setUp() {
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
    const creator = await people.save(
      people.create({
        schoolId: school.id,
        surname: 'Teacher',
        firstName: 'Tia',
      }),
    );
    const medicalType = await alertTypes.create(school.id, {
      name: 'Medical',
      adminOnly: true,
    });
    const academicType = await alertTypes.create(school.id, {
      name: 'Academic',
      adminOnly: false,
    });
    return { school, schoolYear, student, creator, medicalType, academicType };
  }

  describe('create', () => {
    it('creates a non-admin-only alert with an encrypted comment', async () => {
      const { school, schoolYear, student, creator, academicType } =
        await setUp();

      const alert = await service.create(
        school.id,
        creator.id,
        buildTeacherAbility(),
        {
          schoolYearId: schoolYear.id,
          personId: student.id,
          alertTypeId: academicType.id,
          comment: 'Grades dropping in Maths',
        },
      );

      const rawRow = await dataSource
        .createQueryBuilder()
        .select('alert.comment', 'comment')
        .from('student_alerts', 'alert')
        .where('alert.id = :id', { id: alert.id })
        .getRawOne<{ comment: string }>();
      expect(rawRow!.comment).not.toContain('Grades dropping');
    });

    it('rejects a Teacher-ability creating an admin-only-typed alert (bug #1, creation side)', async () => {
      const { school, schoolYear, student, creator, medicalType } =
        await setUp();

      await expect(
        service.create(school.id, creator.id, buildTeacherAbility(), {
          schoolYearId: schoolYear.id,
          personId: student.id,
          alertTypeId: medicalType.id,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('allows an Admin-ability to create an admin-only-typed alert', async () => {
      const { school, schoolYear, student, creator, medicalType } =
        await setUp();

      const alert = await service.create(
        school.id,
        creator.id,
        buildAdminAbility(),
        {
          schoolYearId: schoolYear.id,
          personId: student.id,
          alertTypeId: medicalType.id,
        },
      );

      expect(alert.alertTypeId).toBe(medicalType.id);
    });

    it('rejects a personId from a different school with 400', async () => {
      const { school, schoolYear, creator, academicType } = await setUp();
      const other = await setUp();

      await expect(
        service.create(school.id, creator.id, buildAdminAbility(), {
          schoolYearId: schoolYear.id,
          personId: other.student.id,
          alertTypeId: academicType.id,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getVisibleAlert - real Gibbon bug #1 fix (view gate)', () => {
    it('returns the alert to an Admin-ability regardless of alert type', async () => {
      const { school, schoolYear, student, creator, medicalType } =
        await setUp();
      const alert = await service.create(
        school.id,
        creator.id,
        buildAdminAbility(),
        {
          schoolYearId: schoolYear.id,
          personId: student.id,
          alertTypeId: medicalType.id,
        },
      );

      const found = await service.getVisibleAlert(
        school.id,
        alert.id,
        buildAdminAbility(),
      );

      expect(found.id).toBe(alert.id);
    });

    it('throws NotFoundException (not ForbiddenException) for a Teacher-ability viewing an admin-only alert', async () => {
      const { school, schoolYear, student, creator, medicalType } =
        await setUp();
      const alert = await service.create(
        school.id,
        creator.id,
        buildAdminAbility(),
        {
          schoolYearId: schoolYear.id,
          personId: student.id,
          alertTypeId: medicalType.id,
        },
      );

      await expect(
        service.getVisibleAlert(school.id, alert.id, buildTeacherAbility()),
      ).rejects.toThrow(NotFoundException);
    });

    it('allows a Teacher-ability to view a non-admin-only alert', async () => {
      const { school, schoolYear, student, creator, academicType } =
        await setUp();
      const alert = await service.create(
        school.id,
        creator.id,
        buildTeacherAbility(),
        {
          schoolYearId: schoolYear.id,
          personId: student.id,
          alertTypeId: academicType.id,
        },
      );

      const found = await service.getVisibleAlert(
        school.id,
        alert.id,
        buildTeacherAbility(),
      );

      expect(found.id).toBe(alert.id);
    });
  });

  describe('listForPerson - real Gibbon bug #1 fix (list gate)', () => {
    it('excludes admin-only alerts entirely from a Teacher-ability list, not just hiding fields', async () => {
      const {
        school,
        schoolYear,
        student,
        creator,
        medicalType,
        academicType,
      } = await setUp();
      await service.create(school.id, creator.id, buildAdminAbility(), {
        schoolYearId: schoolYear.id,
        personId: student.id,
        alertTypeId: medicalType.id,
      });
      await service.create(school.id, creator.id, buildTeacherAbility(), {
        schoolYearId: schoolYear.id,
        personId: student.id,
        alertTypeId: academicType.id,
      });

      const teacherList = await service.listForPerson(
        school.id,
        student.id,
        buildTeacherAbility(),
      );
      const adminList = await service.listForPerson(
        school.id,
        student.id,
        buildAdminAbility(),
      );

      expect(teacherList).toHaveLength(1);
      expect(teacherList[0].alertTypeId).toBe(academicType.id);
      expect(adminList).toHaveLength(2);
    });
  });

  describe('getBadgesForPerson - real Gibbon bug #2 fix (no comment leak)', () => {
    it('never includes the comment field in badge output', async () => {
      const { school, schoolYear, student, creator, academicType } =
        await setUp();
      await service.create(school.id, creator.id, buildTeacherAbility(), {
        schoolYearId: schoolYear.id,
        personId: student.id,
        alertTypeId: academicType.id,
        comment: 'Highly confidential detail',
      });

      const badges = await service.getBadgesForPerson(
        school.id,
        student.id,
        buildTeacherAbility(),
      );

      expect(badges).toHaveLength(1);
      expect(badges[0]).not.toHaveProperty('comment');
      expect(JSON.stringify(badges)).not.toContain(
        'Highly confidential detail',
      );
    });

    it('excludes admin-only alert badges from a Teacher-ability caller', async () => {
      const { school, schoolYear, student, creator, medicalType } =
        await setUp();
      await service.create(school.id, creator.id, buildAdminAbility(), {
        schoolYearId: schoolYear.id,
        personId: student.id,
        alertTypeId: medicalType.id,
      });

      const badges = await service.getBadgesForPerson(
        school.id,
        student.id,
        buildTeacherAbility(),
      );

      expect(badges).toHaveLength(0);
    });
  });

  describe('update', () => {
    it('stamps statusByPersonId/statusAt when status changes', async () => {
      const { school, schoolYear, student, creator, academicType } =
        await setUp();
      const alert = await service.create(
        school.id,
        creator.id,
        buildAdminAbility(),
        {
          schoolYearId: schoolYear.id,
          personId: student.id,
          alertTypeId: academicType.id,
        },
      );

      const updated = await service.update(
        school.id,
        alert.id,
        creator.id,
        buildAdminAbility(),
        { status: 'Approved' },
      );

      expect(updated.status).toBe('Approved');
      expect(updated.statusByPersonId).toBe(creator.id);
      expect(updated.statusAt).not.toBeNull();
    });

    it('rejects a Teacher-ability editing an admin-only alert', async () => {
      const { school, schoolYear, student, creator, medicalType } =
        await setUp();
      const alert = await service.create(
        school.id,
        creator.id,
        buildAdminAbility(),
        {
          schoolYearId: schoolYear.id,
          personId: student.id,
          alertTypeId: medicalType.id,
        },
      );

      await expect(
        service.update(school.id, alert.id, creator.id, buildTeacherAbility(), {
          status: 'Approved',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
