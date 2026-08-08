import { randomUUID } from 'node:crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { SchoolModule } from '../school/school.module';
import { PeopleModule } from '../people/people.module';
import { CurriculumModule } from '../curriculum/curriculum.module';
import { RbacModule } from '../rbac/rbac.module';
import { MarkbookModule } from './markbook.module';
import { SchoolsRepository } from '../school/repositories/schools.repository';
import { SchoolYearsRepository } from '../school/repositories/school-years.repository';
import { RolesRepository } from '../rbac/repositories/roles.repository';
import { PeopleRepository } from '../people/repositories/people.repository';
import { FamiliesRepository } from '../people/repositories/families.repository';
import { FamilyAdultsRepository } from '../people/repositories/family-adults.repository';
import { FamilyChildrenRepository } from '../people/repositories/family-children.repository';
import { CoursesService } from '../curriculum/courses.service';
import { CourseClassesService } from '../curriculum/course-classes.service';
import { CourseEnrolmentService } from '../curriculum/course-enrolment.service';
import { ScalesService } from './scales.service';
import { ScaleGradesService } from './scale-grades.service';
import { MarkbookColumnsService } from './markbook-columns.service';
import { MarkbookTargetsService } from './markbook-targets.service';
import { MarkbookEntriesService } from './markbook-entries.service';

describe('MarkbookEntriesService (integration)', () => {
  let module: TestingModule;
  let schools: SchoolsRepository;
  let schoolYears: SchoolYearsRepository;
  let roles: RolesRepository;
  let people: PeopleRepository;
  let families: FamiliesRepository;
  let familyAdults: FamilyAdultsRepository;
  let familyChildren: FamilyChildrenRepository;
  let courses: CoursesService;
  let courseClasses: CourseClassesService;
  let enrolment: CourseEnrolmentService;
  let scales: ScalesService;
  let scaleGrades: ScaleGradesService;
  let columns: MarkbookColumnsService;
  let targets: MarkbookTargetsService;
  let service: MarkbookEntriesService;
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
        MarkbookModule,
      ],
    }).compile();

    schools = module.get(SchoolsRepository);
    schoolYears = module.get(SchoolYearsRepository);
    roles = module.get(RolesRepository);
    people = module.get(PeopleRepository);
    families = module.get(FamiliesRepository);
    familyAdults = module.get(FamilyAdultsRepository);
    familyChildren = module.get(FamilyChildrenRepository);
    courses = module.get(CoursesService);
    courseClasses = module.get(CourseClassesService);
    enrolment = module.get(CourseEnrolmentService);
    scales = module.get(ScalesService);
    scaleGrades = module.get(ScaleGradesService);
    columns = module.get(MarkbookColumnsService);
    targets = module.get(MarkbookTargetsService);
    service = module.get(MarkbookEntriesService);
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

  /** Grades F=1, D=2 (lowestAcceptable), C=3, B=4, A=5. */
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
    const scale = await scales.create(school.id, {
      name: 'Attainment Scale',
      shortName: 'ATT',
    });
    const gradeF = await scaleGrades.create(school.id, scale.id, {
      name: 'F',
      shortName: 'F',
      value: 1,
    });
    const gradeD = await scaleGrades.create(school.id, scale.id, {
      name: 'D',
      shortName: 'D',
      value: 2,
      lowestAcceptable: true,
    });
    const gradeC = await scaleGrades.create(school.id, scale.id, {
      name: 'C',
      shortName: 'C',
      value: 3,
    });
    const gradeA = await scaleGrades.create(school.id, scale.id, {
      name: 'A',
      shortName: 'A',
      value: 5,
    });
    const column = await columns.create(school.id, courseClass.id, {
      name: 'Term 1 Test',
      scaleIdAttainment: scale.id,
      scaleIdEffort: scale.id,
    });
    return {
      school,
      student,
      courseClass,
      scale,
      column,
      gradeF,
      gradeD,
      gradeC,
      gradeA,
    };
  }

  describe('concern calculation', () => {
    it('flags Y when the entered grade is below the scale threshold and no target is set', async () => {
      const { school, student, column, gradeF } = await setUp();

      const entry = await service.upsertEntry(school.id, column.id, {
        personId: student.id,
        attainmentScaleGradeId: gradeF.id,
      });

      expect(entry.attainmentConcern).toBe('Y');
    });

    it('flags N when the entered grade meets the scale threshold and no target is set', async () => {
      const { school, student, column, gradeD } = await setUp();

      const entry = await service.upsertEntry(school.id, column.id, {
        personId: student.id,
        attainmentScaleGradeId: gradeD.id,
      });

      expect(entry.attainmentConcern).toBe('N');
    });

    it('flags Y when a personal target is set and the entered grade falls short of it', async () => {
      const { school, student, courseClass, column, gradeF, gradeC } =
        await setUp();
      await targets.create(school.id, courseClass.id, {
        personId: student.id,
        targetScaleGradeId: gradeC.id,
      });

      const entry = await service.upsertEntry(school.id, column.id, {
        personId: student.id,
        attainmentScaleGradeId: gradeF.id,
      });

      expect(entry.attainmentConcern).toBe('Y');
    });

    it('flags P when a personal target is set and the entered grade exceeds it', async () => {
      const { school, student, courseClass, column, gradeA, gradeC } =
        await setUp();
      await targets.create(school.id, courseClass.id, {
        personId: student.id,
        targetScaleGradeId: gradeC.id,
      });

      const entry = await service.upsertEntry(school.id, column.id, {
        personId: student.id,
        attainmentScaleGradeId: gradeA.id,
      });

      expect(entry.attainmentConcern).toBe('P');
    });

    it("rejects a grade that does not belong to the column's configured scale", async () => {
      const { school, student, column } = await setUp();
      const other = await setUp();

      await expect(
        service.upsertEntry(school.id, column.id, {
          personId: student.id,
          attainmentScaleGradeId: other.gradeC.id,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('upserts in place rather than creating a second row for the same student', async () => {
      const { school, student, column, gradeF, gradeA } = await setUp();
      await service.upsertEntry(school.id, column.id, {
        personId: student.id,
        attainmentScaleGradeId: gradeF.id,
      });

      const updated = await service.upsertEntry(school.id, column.id, {
        personId: student.id,
        attainmentScaleGradeId: gradeA.id,
      });

      const roster = await service.listForColumn(school.id, column.id);
      expect(roster).toHaveLength(1);
      expect(updated.attainmentScaleGradeId).toBe(gradeA.id);
    });
  });

  describe('column visibility gate', () => {
    async function setUpRoleActor(
      schoolId: string,
      category: 'Staff' | 'Student' | 'Parent',
    ) {
      const role = await roles.save(
        roles.create({
          schoolId,
          category,
          name: randomUUID(),
          shortName: category.slice(0, 3),
          description: 'test role',
          restriction: 'None',
        }),
      );
      const person = await people.save(
        people.create({ schoolId, surname: category, firstName: 'Actor' }),
      );
      return { role, person };
    }

    it('always shows the full entry to a teacher/staff caller, regardless of column flags', async () => {
      const { school, student, column, gradeF } = await setUp();
      await service.upsertEntry(school.id, column.id, {
        personId: student.id,
        attainmentScaleGradeId: gradeF.id,
      });
      const { role: staffRole, person: teacher } = await setUpRoleActor(
        school.id,
        'Staff',
      );

      const entry = await service.getVisibleEntryForCaller(
        school.id,
        column.id,
        student.id,
        { personId: teacher.id, activeRoleId: staffRole.id },
      );

      expect(entry.personId).toBe(student.id);
    });

    it('hides the entry from the student when viewableStudents is false, even if complete', async () => {
      const { school, student, column, gradeF } = await setUp();
      await service.upsertEntry(school.id, column.id, {
        personId: student.id,
        attainmentScaleGradeId: gradeF.id,
      });
      await columns.update(school.id, column.id, {
        complete: true,
        viewableStudents: false,
      });
      const { role: studentRole } = await setUpRoleActor(school.id, 'Student');

      await expect(
        service.getVisibleEntryForCaller(school.id, column.id, student.id, {
          personId: student.id,
          activeRoleId: studentRole.id,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('shows the entry to the student once viewableStudents/complete/completeDate all clear', async () => {
      const { school, student, column, gradeF } = await setUp();
      await service.upsertEntry(school.id, column.id, {
        personId: student.id,
        attainmentScaleGradeId: gradeF.id,
      });
      await columns.update(school.id, column.id, {
        complete: true,
        viewableStudents: true,
        completeDate: '2020-01-01',
      });
      const { role: studentRole } = await setUpRoleActor(school.id, 'Student');

      const entry = await service.getVisibleEntryForCaller(
        school.id,
        column.id,
        student.id,
        { personId: student.id, activeRoleId: studentRole.id },
      );

      expect(entry.attainmentScaleGradeId).toBe(gradeF.id);
    });

    it('hides the entry from the student when completeDate is in the future', async () => {
      const { school, student, column, gradeF } = await setUp();
      await service.upsertEntry(school.id, column.id, {
        personId: student.id,
        attainmentScaleGradeId: gradeF.id,
      });
      await columns.update(school.id, column.id, {
        complete: true,
        viewableStudents: true,
        completeDate: '2099-01-01',
      });
      const { role: studentRole } = await setUpRoleActor(school.id, 'Student');

      await expect(
        service.getVisibleEntryForCaller(school.id, column.id, student.id, {
          personId: student.id,
          activeRoleId: studentRole.id,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('shows the entry to a parent with childDataAccess once viewableParents/complete clear', async () => {
      const { school, student, column, gradeF } = await setUp();
      await service.upsertEntry(school.id, column.id, {
        personId: student.id,
        attainmentScaleGradeId: gradeF.id,
      });
      await columns.update(school.id, column.id, {
        complete: true,
        viewableParents: true,
      });
      const { role: parentRole, person: parent } = await setUpRoleActor(
        school.id,
        'Parent',
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

      const entry = await service.getVisibleEntryForCaller(
        school.id,
        column.id,
        student.id,
        { personId: parent.id, activeRoleId: parentRole.id },
      );

      expect(entry.attainmentScaleGradeId).toBe(gradeF.id);
    });

    it('hides the entry from a parent without childDataAccess', async () => {
      const { school, student, column, gradeF } = await setUp();
      await service.upsertEntry(school.id, column.id, {
        personId: student.id,
        attainmentScaleGradeId: gradeF.id,
      });
      await columns.update(school.id, column.id, {
        complete: true,
        viewableParents: true,
      });
      const { role: parentRole, person: parent } = await setUpRoleActor(
        school.id,
        'Parent',
      );
      const family = await families.save(
        families.create({ schoolId: school.id, name: 'The Family' }),
      );
      await familyAdults.save(
        familyAdults.create({
          familyId: family.id,
          personId: parent.id,
          childDataAccess: false,
        }),
      );
      await familyChildren.save(
        familyChildren.create({ familyId: family.id, personId: student.id }),
      );

      await expect(
        service.getVisibleEntryForCaller(school.id, column.id, student.id, {
          personId: parent.id,
          activeRoleId: parentRole.id,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('never returns 403-shaped denial - an unauthorized viewer always gets NotFoundException', async () => {
      const { school, student, column, gradeF } = await setUp();
      await service.upsertEntry(school.id, column.id, {
        personId: student.id,
        attainmentScaleGradeId: gradeF.id,
      });
      const { role: strangerRole, person: stranger } = await setUpRoleActor(
        school.id,
        'Student',
      );

      await expect(
        service.getVisibleEntryForCaller(school.id, column.id, student.id, {
          personId: stranger.id,
          activeRoleId: strangerRole.id,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
