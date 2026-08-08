import { randomUUID } from 'node:crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { SchoolModule } from '../school/school.module';
import { PeopleModule } from '../people/people.module';
import { CurriculumModule } from '../curriculum/curriculum.module';
import { RbacModule } from '../rbac/rbac.module';
import { IndividualNeedsModule } from './individual-needs.module';
import { SchoolsRepository } from '../school/repositories/schools.repository';
import { SchoolYearsRepository } from '../school/repositories/school-years.repository';
import { PeopleRepository } from '../people/repositories/people.repository';
import { CoursesService } from '../curriculum/courses.service';
import { CourseClassesService } from '../curriculum/course-classes.service';
import { CourseEnrolmentService } from '../curriculum/course-enrolment.service';
import { IndividualNeedInvestigationsService } from './individual-need-investigations.service';
import { IndividualNeedInvestigationContributionsService } from './individual-need-investigation-contributions.service';

describe('IndividualNeedInvestigationContributionsService (integration)', () => {
  let module: TestingModule;
  let schools: SchoolsRepository;
  let schoolYears: SchoolYearsRepository;
  let people: PeopleRepository;
  let courses: CoursesService;
  let courseClasses: CourseClassesService;
  let enrolment: CourseEnrolmentService;
  let investigations: IndividualNeedInvestigationsService;
  let service: IndividualNeedInvestigationContributionsService;
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
        IndividualNeedsModule,
      ],
    }).compile();

    schools = module.get(SchoolsRepository);
    schoolYears = module.get(SchoolYearsRepository);
    people = module.get(PeopleRepository);
    courses = module.get(CoursesService);
    courseClasses = module.get(CourseClassesService);
    enrolment = module.get(CourseEnrolmentService);
    investigations = module.get(IndividualNeedInvestigationsService);
    service = module.get(IndividualNeedInvestigationContributionsService);
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
    const teacher = await people.save(
      people.create({
        schoolId: school.id,
        surname: 'Teacher',
        firstName: 'Tia',
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
    const enrolmentRow = await enrolment.enrol(school.id, courseClass.id, {
      personId: teacher.id,
      role: 'Teacher',
    });
    const investigation = await investigations.create(school.id, teacher.id, {
      schoolYearId: schoolYear.id,
      studentPersonId: student.id,
      date: '2026-09-01',
      reason: 'Reason',
    });
    return { school, teacher, investigation, enrolmentRow };
  }

  it('creates a contribution linked to a course class enrolment', async () => {
    const { school, teacher, investigation, enrolmentRow } = await setUp();

    const contribution = await service.create(school.id, investigation.id, {
      personId: teacher.id,
      courseClassPersonId: enrolmentRow.id,
    });

    expect(contribution.type).toBe('Teacher');
    expect(contribution.status).toBe('Pending');
  });

  it('rejects a courseClassPersonId from a different school with 400', async () => {
    const { school, teacher, investigation } = await setUp();
    const other = await setUp();

    await expect(
      service.create(school.id, investigation.id, {
        personId: teacher.id,
        courseClassPersonId: other.enrolmentRow.id,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('updates narrative fields and marks a contribution complete', async () => {
    const { school, teacher, investigation } = await setUp();
    const contribution = await service.create(school.id, investigation.id, {
      personId: teacher.id,
    });

    const updated = await service.update(school.id, contribution.id, {
      status: 'Complete',
      cognition: 'Struggles with multi-step instructions',
      attention: 'Easily distracted in open-plan settings',
    });

    expect(updated.status).toBe('Complete');
    expect(updated.cognition).toBe('Struggles with multi-step instructions');
  });

  it('lists contributions for an investigation', async () => {
    const { school, teacher, investigation } = await setUp();
    await service.create(school.id, investigation.id, { personId: teacher.id });

    const list = await service.list(school.id, investigation.id);

    expect(list).toHaveLength(1);
  });
});
