import { randomUUID } from 'node:crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { SchoolModule } from '../school/school.module';
import { PeopleModule } from '../people/people.module';
import { CurriculumModule } from '../curriculum/curriculum.module';
import { RbacModule } from '../rbac/rbac.module';
import { AttendanceModule } from './attendance.module';
import { SchoolsRepository } from '../school/repositories/schools.repository';
import { SchoolYearsRepository } from '../school/repositories/school-years.repository';
import { YearGroupsRepository } from '../school/repositories/year-groups.repository';
import { FormGroupsRepository } from '../school/repositories/form-groups.repository';
import { PeopleRepository } from '../people/repositories/people.repository';
import { StudentEnrolmentsRepository } from '../people/repositories/student-enrolments.repository';
import { RolesRepository } from '../rbac/repositories/roles.repository';
import { CoursesService } from '../curriculum/courses.service';
import { CourseClassesService } from '../curriculum/course-classes.service';
import { CourseEnrolmentService } from '../curriculum/course-enrolment.service';
import { AttendanceCodesService } from './attendance-codes.service';
import { AttendanceRegisterService } from './attendance-register.service';
import { AttendanceLogFormGroupsRepository } from './repositories/attendance-log-form-groups.repository';
import { AttendanceLogCourseClassesRepository } from './repositories/attendance-log-course-classes.repository';

describe('AttendanceRegisterService (integration)', () => {
  let module: TestingModule;
  let schools: SchoolsRepository;
  let schoolYears: SchoolYearsRepository;
  let yearGroups: YearGroupsRepository;
  let formGroups: FormGroupsRepository;
  let people: PeopleRepository;
  let studentEnrolments: StudentEnrolmentsRepository;
  let roles: RolesRepository;
  let courses: CoursesService;
  let courseClasses: CourseClassesService;
  let enrolment: CourseEnrolmentService;
  let codes: AttendanceCodesService;
  let logFormGroups: AttendanceLogFormGroupsRepository;
  let logCourseClasses: AttendanceLogCourseClassesRepository;
  let service: AttendanceRegisterService;
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
        AttendanceModule,
      ],
    }).compile();

    schools = module.get(SchoolsRepository);
    schoolYears = module.get(SchoolYearsRepository);
    yearGroups = module.get(YearGroupsRepository);
    formGroups = module.get(FormGroupsRepository);
    people = module.get(PeopleRepository);
    studentEnrolments = module.get(StudentEnrolmentsRepository);
    roles = module.get(RolesRepository);
    courses = module.get(CoursesService);
    courseClasses = module.get(CourseClassesService);
    enrolment = module.get(CourseEnrolmentService);
    codes = module.get(AttendanceCodesService);
    logFormGroups = module.get(AttendanceLogFormGroupsRepository);
    logCourseClasses = module.get(AttendanceLogCourseClassesRepository);
    service = module.get(AttendanceRegisterService);
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
    const student = await people.save(
      people.create({
        schoolId: school.id,
        surname: 'Student',
        firstName: 'Sam',
      }),
    );
    await studentEnrolments.save(
      studentEnrolments.create({
        personId: student.id,
        schoolYearId: schoolYear.id,
        yearGroupId: yearGroup.id,
        formGroupId: formGroup.id,
      }),
    );
    const course = await courses.create(school.id, {
      schoolYearId: schoolYear.id,
      name: 'Maths',
      shortName: 'MATH',
    });
    const courseClass = await courseClasses.create(school.id, course.id, {
      name: 'Maths 7A',
      shortName: 'M7A',
    });
    await enrolment.enrol(school.id, courseClass.id, {
      personId: student.id,
      role: 'Student',
    });
    const presentCode = await codes.create(school.id, {
      name: 'Present',
      shortName: 'P',
      direction: 'In',
      scope: 'Onsite',
    });
    const staffRole = await roles.save(
      roles.create({
        schoolId: school.id,
        category: 'Staff',
        name: randomUUID(),
        shortName: 'Tcr',
        description: 'Teacher',
        restriction: 'None',
      }),
    );
    const noGrantsRole = await roles.save(
      roles.create({
        schoolId: school.id,
        category: 'Staff',
        name: randomUUID(),
        shortName: 'Bar',
        description: 'restricted-out role',
        restriction: 'None',
      }),
    );
    const taker = await people.save(
      people.create({
        schoolId: school.id,
        surname: 'Teacher',
        firstName: 'Tia',
      }),
    );
    return {
      school,
      formGroup,
      courseClass,
      student,
      presentCode,
      staffRole,
      noGrantsRole,
      taker,
    };
  }

  describe('recordForFormGroup', () => {
    it('records attendance for an enrolled student and marks the register taken', async () => {
      const { school, formGroup, student, presentCode, staffRole, taker } =
        await setUp();

      const results = await service.recordForFormGroup(
        school.id,
        formGroup.id,
        { personId: taker.id, activeRoleId: staffRole.id },
        {
          date: '2026-09-01',
          entries: [{ personId: student.id, attendanceCodeId: presentCode.id }],
        },
      );

      expect(results).toHaveLength(1);
      expect(results[0].direction).toBe('In');
      expect(results[0].context).toBe('Form Group');

      const marker = await logFormGroups.findByFormGroupAndDate(
        formGroup.id,
        '2026-09-01',
      );
      expect(marker).not.toBeNull();
      expect(marker!.takenByPersonId).toBe(taker.id);
    });

    it('upserts in place when the register is retaken for the same date', async () => {
      const { school, formGroup, student, presentCode, staffRole, taker } =
        await setUp();
      await service.recordForFormGroup(
        school.id,
        formGroup.id,
        { personId: taker.id, activeRoleId: staffRole.id },
        {
          date: '2026-09-01',
          entries: [
            {
              personId: student.id,
              attendanceCodeId: presentCode.id,
              comment: 'first pass',
            },
          ],
        },
      );

      const second = await service.recordForFormGroup(
        school.id,
        formGroup.id,
        { personId: taker.id, activeRoleId: staffRole.id },
        {
          date: '2026-09-01',
          entries: [
            {
              personId: student.id,
              attendanceCodeId: presentCode.id,
              comment: 'corrected',
            },
          ],
        },
      );

      expect(second).toHaveLength(1);
      expect(second[0].comment).toBe('corrected');
    });

    it('rejects a student not enrolled in the form group with 400', async () => {
      const { school, formGroup, presentCode, staffRole, taker } =
        await setUp();
      const stranger = await people.save(
        people.create({
          schoolId: school.id,
          surname: 'Stranger',
          firstName: 'Sue',
        }),
      );

      await expect(
        service.recordForFormGroup(
          school.id,
          formGroup.id,
          { personId: taker.id, activeRoleId: staffRole.id },
          {
            date: '2026-09-01',
            entries: [
              { personId: stranger.id, attendanceCodeId: presentCode.id },
            ],
          },
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects recording a role-restricted code by a role not on the allow-list', async () => {
      const { school, formGroup, student, staffRole, noGrantsRole, taker } =
        await setUp();
      const medicalCode = await codes.create(school.id, {
        name: 'Medical Absence',
        shortName: 'MED',
        direction: 'Out',
        scope: 'Offsite',
      });
      await codes.setRestrictedRoles(school.id, medicalCode.id, [staffRole.id]);

      await expect(
        service.recordForFormGroup(
          school.id,
          formGroup.id,
          { personId: taker.id, activeRoleId: noGrantsRole.id },
          {
            date: '2026-09-01',
            entries: [
              { personId: student.id, attendanceCodeId: medicalCode.id },
            ],
          },
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('allows recording a role-restricted code by an allow-listed role', async () => {
      const { school, formGroup, student, staffRole, taker } = await setUp();
      const medicalCode = await codes.create(school.id, {
        name: 'Medical Absence',
        shortName: 'MED',
        direction: 'Out',
        scope: 'Offsite',
      });
      await codes.setRestrictedRoles(school.id, medicalCode.id, [staffRole.id]);

      const results = await service.recordForFormGroup(
        school.id,
        formGroup.id,
        { personId: taker.id, activeRoleId: staffRole.id },
        {
          date: '2026-09-01',
          entries: [
            {
              personId: student.id,
              attendanceCodeId: medicalCode.id,
              reason: 'Medical',
            },
          ],
        },
      );

      expect(results[0].reason).toBe('Medical');
    });
  });

  describe('recordForCourseClass', () => {
    it('records attendance for an enrolled student and marks the class register taken', async () => {
      const { school, courseClass, student, presentCode, staffRole, taker } =
        await setUp();

      const results = await service.recordForCourseClass(
        school.id,
        courseClass.id,
        { personId: taker.id, activeRoleId: staffRole.id },
        {
          date: '2026-09-01',
          entries: [{ personId: student.id, attendanceCodeId: presentCode.id }],
        },
      );

      expect(results).toHaveLength(1);
      expect(results[0].context).toBe('Class');

      const marker = await logCourseClasses.findByCourseClassAndDate(
        courseClass.id,
        '2026-09-01',
      );
      expect(marker).not.toBeNull();
    });

    it('rejects a student not enrolled in the class with 400', async () => {
      const { school, courseClass, presentCode, staffRole, taker } =
        await setUp();
      const stranger = await people.save(
        people.create({
          schoolId: school.id,
          surname: 'Stranger',
          firstName: 'Sue',
        }),
      );

      await expect(
        service.recordForCourseClass(
          school.id,
          courseClass.id,
          { personId: taker.id, activeRoleId: staffRole.id },
          {
            date: '2026-09-01',
            entries: [
              { personId: stranger.id, attendanceCodeId: presentCode.id },
            ],
          },
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('listForPerson', () => {
    it('returns attendance history within a date range', async () => {
      const { school, formGroup, student, presentCode, staffRole, taker } =
        await setUp();
      await service.recordForFormGroup(
        school.id,
        formGroup.id,
        { personId: taker.id, activeRoleId: staffRole.id },
        {
          date: '2026-09-01',
          entries: [{ personId: student.id, attendanceCodeId: presentCode.id }],
        },
      );

      const history = await service.listForPerson(
        student.id,
        '2026-09-01',
        '2026-09-07',
      );

      expect(history).toHaveLength(1);
      expect(history[0].date).toBe('2026-09-01');
    });
  });
});
