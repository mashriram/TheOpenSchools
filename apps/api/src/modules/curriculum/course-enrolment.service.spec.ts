import { randomUUID } from 'node:crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { NotFoundException } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { SchoolModule } from '../school/school.module';
import { PeopleModule } from '../people/people.module';
import { CurriculumModule } from './curriculum.module';
import { SchoolsRepository } from '../school/repositories/schools.repository';
import { SchoolYearsRepository } from '../school/repositories/school-years.repository';
import { PeopleRepository } from '../people/repositories/people.repository';
import { CoursesService } from './courses.service';
import { CourseClassesService } from './course-classes.service';
import { CourseEnrolmentService } from './course-enrolment.service';

describe('CourseEnrolmentService (integration)', () => {
  let module: TestingModule;
  let schools: SchoolsRepository;
  let schoolYears: SchoolYearsRepository;
  let people: PeopleRepository;
  let courses: CoursesService;
  let courseClasses: CourseClassesService;
  let service: CourseEnrolmentService;
  let createdSchoolIds: string[];

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        DatabaseModule,
        SchoolModule,
        PeopleModule,
        CurriculumModule,
      ],
    }).compile();

    schools = module.get(SchoolsRepository);
    schoolYears = module.get(SchoolYearsRepository);
    people = module.get(PeopleRepository);
    courses = module.get(CoursesService);
    courseClasses = module.get(CourseClassesService);
    service = module.get(CourseEnrolmentService);
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

  function today(): string {
    return new Date().toISOString().slice(0, 10);
  }

  async function createFixture() {
    const school = await schools.save(
      schools.create({ name: 'Test School', subdomainSlug: randomUUID() }),
    );
    createdSchoolIds.push(school.id);
    const schoolYear = await schoolYears.save(
      schoolYears.create({
        schoolId: school.id,
        name: '2026',
        sequenceNumber: 1,
      }),
    );
    const course = await courses.create(school.id, {
      schoolYearId: schoolYear.id,
      name: 'Mathematics',
      shortName: 'MATH',
    });
    const courseClass = await courseClasses.create(school.id, course.id, {
      name: 'Mathematics 7A',
      shortName: '7A',
    });
    const person = await people.save(
      people.create({
        schoolId: school.id,
        surname: 'Student',
        firstName: 'Sam',
        email: `${randomUUID()}@example.com`,
      }),
    );
    return { school, course, courseClass, person };
  }

  it('enrols a new person with dateEnrolled set to today and dateUnenrolled null', async () => {
    const { school, courseClass, person } = await createFixture();

    const enrolment = await service.enrol(school.id, courseClass.id, {
      personId: person.id,
      role: 'Student',
    });

    expect(enrolment.dateEnrolled).toBe(today());
    expect(enrolment.dateUnenrolled).toBeNull();
    expect(enrolment.role).toBe('Student');

    const listed = await service.list(school.id, courseClass.id);
    expect(listed).toHaveLength(1);
  });

  it('re-enrolling an existing person updates the row instead of creating a second one', async () => {
    const { school, courseClass, person } = await createFixture();
    const first = await service.enrol(school.id, courseClass.id, {
      personId: person.id,
      role: 'Student',
    });
    await service.unenrol(school.id, courseClass.id, first.id);

    const second = await service.enrol(school.id, courseClass.id, {
      personId: person.id,
      role: 'Student',
    });

    expect(second.id).toBe(first.id);
    expect(second.dateUnenrolled).toBeNull();
    expect(second.dateEnrolled).toBe(today());
    const listed = await service.list(school.id, courseClass.id);
    expect(listed).toHaveLength(1);
  });

  it('unenrolling sets dateUnenrolled to today', async () => {
    const { school, courseClass, person } = await createFixture();
    const enrolment = await service.enrol(school.id, courseClass.id, {
      personId: person.id,
      role: 'Student',
    });

    const unenrolled = await service.unenrol(
      school.id,
      courseClass.id,
      enrolment.id,
    );

    expect(unenrolled.dateUnenrolled).toBe(today());
  });

  it('updateRole never changes the date columns', async () => {
    const { school, courseClass, person } = await createFixture();
    const enrolment = await service.enrol(school.id, courseClass.id, {
      personId: person.id,
      role: 'Student',
    });
    const dateEnrolledBefore = enrolment.dateEnrolled;

    const updated = await service.updateRole(
      school.id,
      courseClass.id,
      enrolment.id,
      { role: 'Teacher', reportable: false },
    );

    expect(updated.role).toBe('Teacher');
    expect(updated.reportable).toBe(false);
    expect(updated.dateEnrolled).toBe(dateEnrolledBefore);
    expect(updated.dateUnenrolled).toBeNull();
  });

  it('rejects enrolling a person who does not belong to the same school', async () => {
    const { school, courseClass } = await createFixture();
    const { person: personInOtherSchool } = await createFixture();

    await expect(
      service.enrol(school.id, courseClass.id, {
        personId: personInOtherSchool.id,
        role: 'Student',
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws NotFound enrolling into a class from a different school', async () => {
    const { courseClass, person } = await createFixture();
    const { school: otherSchool } = await createFixture();

    await expect(
      service.enrol(otherSchool.id, courseClass.id, {
        personId: person.id,
        role: 'Student',
      }),
    ).rejects.toThrow(NotFoundException);
  });
});
