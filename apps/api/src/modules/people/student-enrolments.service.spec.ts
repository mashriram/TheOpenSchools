import { randomUUID } from 'node:crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { PeopleModule } from './people.module';
import { SchoolModule } from '../school/school.module';
import { SchoolsRepository } from '../school/repositories/schools.repository';
import { SchoolYearsRepository } from '../school/repositories/school-years.repository';
import { YearGroupsRepository } from '../school/repositories/year-groups.repository';
import { FormGroupsRepository } from '../school/repositories/form-groups.repository';
import { PeopleService } from './people.service';
import { StudentEnrolmentsService } from './student-enrolments.service';

describe('StudentEnrolmentsService (integration)', () => {
  let module: TestingModule;
  let schools: SchoolsRepository;
  let schoolYears: SchoolYearsRepository;
  let yearGroups: YearGroupsRepository;
  let formGroups: FormGroupsRepository;
  let people: PeopleService;
  let service: StudentEnrolmentsService;
  let createdSchoolIds: string[];

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        DatabaseModule,
        SchoolModule,
        PeopleModule,
      ],
    }).compile();

    schools = module.get(SchoolsRepository);
    schoolYears = module.get(SchoolYearsRepository);
    yearGroups = module.get(YearGroupsRepository);
    formGroups = module.get(FormGroupsRepository);
    people = module.get(PeopleService);
    service = module.get(StudentEnrolmentsService);
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
    const person = await people.create(school.id, {
      surname: 'Smith',
      firstName: 'Jo',
    });
    return { school, schoolYear, yearGroup, formGroup, person };
  }

  it('creates an enrolment', async () => {
    const { school, schoolYear, yearGroup, formGroup, person } =
      await createFixture();

    const enrolment = await service.create(school.id, person.id, {
      schoolYearId: schoolYear.id,
      yearGroupId: yearGroup.id,
      formGroupId: formGroup.id,
    });

    expect(enrolment.personId).toBe(person.id);
  });

  it('rejects a duplicate enrolment for the same person and school year', async () => {
    const { school, schoolYear, yearGroup, formGroup, person } =
      await createFixture();
    await service.create(school.id, person.id, {
      schoolYearId: schoolYear.id,
      yearGroupId: yearGroup.id,
      formGroupId: formGroup.id,
    });

    await expect(
      service.create(school.id, person.id, {
        schoolYearId: schoolYear.id,
        yearGroupId: yearGroup.id,
        formGroupId: formGroup.id,
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('rejects a formGroupId that belongs to a different school year', async () => {
    const { school, schoolYear, yearGroup, person } = await createFixture();
    const { schoolYear: otherYear } = await createFixture();
    const formGroupInOtherYear = await formGroups.save(
      formGroups.create({
        schoolYearId: otherYear.id,
        name: '7B',
        shortName: '7B',
      }),
    );

    await expect(
      service.create(school.id, person.id, {
        schoolYearId: schoolYear.id,
        yearGroupId: yearGroup.id,
        formGroupId: formGroupInOtherYear.id,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects a yearGroupId belonging to a different school', async () => {
    const { school, schoolYear, formGroup, person } = await createFixture();
    const { yearGroup: yearGroupInOtherSchool } = await createFixture();

    await expect(
      service.create(school.id, person.id, {
        schoolYearId: schoolYear.id,
        yearGroupId: yearGroupInOtherSchool.id,
        formGroupId: formGroup.id,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('updates the formGroupId within the same school year', async () => {
    const { school, schoolYear, yearGroup, formGroup, person } =
      await createFixture();
    const enrolment = await service.create(school.id, person.id, {
      schoolYearId: schoolYear.id,
      yearGroupId: yearGroup.id,
      formGroupId: formGroup.id,
    });
    const secondFormGroup = await formGroups.save(
      formGroups.create({
        schoolYearId: schoolYear.id,
        name: '7B',
        shortName: '7B',
      }),
    );

    const updated = await service.update(school.id, person.id, enrolment.id, {
      formGroupId: secondFormGroup.id,
    });

    expect(updated.formGroupId).toBe(secondFormGroup.id);
  });

  it('lists enrolments for a person', async () => {
    const { school, schoolYear, yearGroup, formGroup, person } =
      await createFixture();
    await service.create(school.id, person.id, {
      schoolYearId: schoolYear.id,
      yearGroupId: yearGroup.id,
      formGroupId: formGroup.id,
    });

    const found = await service.list(school.id, person.id);

    expect(found).toHaveLength(1);
  });

  it('throws NotFound for a person belonging to a different school', async () => {
    const { schoolYear, yearGroup, formGroup, person } = await createFixture();
    const otherSchool = await schools.save(
      schools.create({ name: 'Other School', subdomainSlug: randomUUID() }),
    );
    createdSchoolIds.push(otherSchool.id);

    await expect(
      service.create(otherSchool.id, person.id, {
        schoolYearId: schoolYear.id,
        yearGroupId: yearGroup.id,
        formGroupId: formGroup.id,
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('soft-removes an enrolment', async () => {
    const { school, schoolYear, yearGroup, formGroup, person } =
      await createFixture();
    const enrolment = await service.create(school.id, person.id, {
      schoolYearId: schoolYear.id,
      yearGroupId: yearGroup.id,
      formGroupId: formGroup.id,
    });

    await service.remove(school.id, person.id, enrolment.id);

    expect(await service.list(school.id, person.id)).toHaveLength(0);
  });
});
