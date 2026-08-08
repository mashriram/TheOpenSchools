import { randomUUID } from 'node:crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { SchoolModule } from './school.module';
import { PeopleModule } from '../people/people.module';
import { SchoolsRepository } from './repositories/schools.repository';
import { SchoolYearsRepository } from './repositories/school-years.repository';
import { PeopleRepository } from '../people/repositories/people.repository';
import { FormGroupsService } from './form-groups.service';
import { FormGroupStaffService } from './form-group-staff.service';

describe('FormGroupStaffService (integration)', () => {
  let module: TestingModule;
  let schools: SchoolsRepository;
  let schoolYears: SchoolYearsRepository;
  let people: PeopleRepository;
  let formGroups: FormGroupsService;
  let service: FormGroupStaffService;
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
    people = module.get(PeopleRepository);
    formGroups = module.get(FormGroupsService);
    service = module.get(FormGroupStaffService);
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
    const formGroup = await formGroups.create(school.id, {
      schoolYearId: schoolYear.id,
      name: '7A',
      shortName: '7A',
    });
    const person = await people.save(
      people.create({
        schoolId: school.id,
        surname: 'Smith',
        firstName: 'Jo',
        email: `${randomUUID()}@example.com`,
      }),
    );
    return { school, formGroup, person };
  }

  it('adds and lists a staff assignment', async () => {
    const { school, formGroup, person } = await createFixture();

    await service.add(school.id, formGroup.id, {
      personId: person.id,
      role: 'Tutor',
    });

    const found = await service.list(school.id, formGroup.id);
    expect(found).toHaveLength(1);
    expect(found[0].role).toBe('Tutor');
    expect(found[0].person.id).toBe(person.id);
  });

  it('rejects a personId belonging to a different school', async () => {
    const { school, formGroup } = await createFixture();
    const { person: personInOtherSchool } = await createFixture();

    await expect(
      service.add(school.id, formGroup.id, {
        personId: personInOtherSchool.id,
        role: 'Tutor',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects assigning the same person to the same form group twice', async () => {
    const { school, formGroup, person } = await createFixture();
    await service.add(school.id, formGroup.id, {
      personId: person.id,
      role: 'Tutor',
    });

    await expect(
      service.add(school.id, formGroup.id, {
        personId: person.id,
        role: 'LearningAssistant',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('throws NotFound operating on a form group belonging to a different school', async () => {
    const { formGroup, person } = await createFixture();
    const { school: otherSchool } = await createFixture();

    await expect(
      service.add(otherSchool.id, formGroup.id, {
        personId: person.id,
        role: 'Tutor',
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('removes a staff assignment', async () => {
    const { school, formGroup, person } = await createFixture();
    const staff = await service.add(school.id, formGroup.id, {
      personId: person.id,
      role: 'Tutor',
    });

    await service.remove(school.id, formGroup.id, staff.id);

    expect(await service.list(school.id, formGroup.id)).toHaveLength(0);
  });
});
