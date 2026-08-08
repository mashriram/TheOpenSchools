import { randomUUID } from 'node:crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { SchoolModule } from './school.module';
import { SchoolsRepository } from './repositories/schools.repository';
import { SchoolYearsRepository } from './repositories/school-years.repository';
import { SpacesRepository } from './repositories/spaces.repository';
import { FormGroupsRepository } from './repositories/form-groups.repository';
import { FormGroupsService } from './form-groups.service';

describe('FormGroupsService (integration)', () => {
  let module: TestingModule;
  let schools: SchoolsRepository;
  let schoolYears: SchoolYearsRepository;
  let spaces: SpacesRepository;
  let formGroups: FormGroupsRepository;
  let service: FormGroupsService;
  let createdSchoolIds: string[];

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        DatabaseModule,
        SchoolModule,
      ],
    }).compile();

    schools = module.get(SchoolsRepository);
    schoolYears = module.get(SchoolYearsRepository);
    formGroups = module.get(FormGroupsRepository);
    spaces = module.get(SpacesRepository);
    service = module.get(FormGroupsService);
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

  async function createSchoolWithYear() {
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
    return { school, schoolYear };
  }

  it('creates a form group with defaults applied', async () => {
    const { school, schoolYear } = await createSchoolWithYear();

    const formGroup = await service.create(school.id, {
      schoolYearId: schoolYear.id,
      name: '7A',
      shortName: '7A',
    });

    expect(formGroup.attendance).toBe(true);
    expect(formGroup.spaceId).toBeNull();
  });

  it('rejects a schoolYearId belonging to a different school', async () => {
    const { school } = await createSchoolWithYear();
    const { schoolYear: otherYear } = await createSchoolWithYear();

    await expect(
      service.create(school.id, {
        schoolYearId: otherYear.id,
        name: '7A',
        shortName: '7A',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects a spaceId belonging to a different school', async () => {
    const { school, schoolYear } = await createSchoolWithYear();
    const { school: otherSchool } = await createSchoolWithYear();
    const spaceInOtherSchool = await spaces.save(
      spaces.create({ schoolId: otherSchool.id, name: 'Room 1' }),
    );

    await expect(
      service.create(school.id, {
        schoolYearId: schoolYear.id,
        name: '7A',
        shortName: '7A',
        spaceId: spaceInOtherSchool.id,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('links a valid spaceId from the same school', async () => {
    const { school, schoolYear } = await createSchoolWithYear();
    const space = await spaces.save(
      spaces.create({ schoolId: school.id, name: 'Room 1' }),
    );

    const formGroup = await service.create(school.id, {
      schoolYearId: schoolYear.id,
      name: '7A',
      shortName: '7A',
      spaceId: space.id,
    });

    expect(formGroup.spaceId).toBe(space.id);
  });

  it('rejects a nextFormGroupId from a different school year', async () => {
    const { school, schoolYear } = await createSchoolWithYear();
    const { school: otherSchool, schoolYear: otherYear } =
      await createSchoolWithYear();
    const nextInOtherYear = await service.create(otherSchool.id, {
      schoolYearId: otherYear.id,
      name: '8A',
      shortName: '8A',
    });

    await expect(
      service.create(school.id, {
        schoolYearId: schoolYear.id,
        name: '7A',
        shortName: '7A',
        nextFormGroupId: nextInOtherYear.id,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('lists form groups scoped to a school year', async () => {
    const { school, schoolYear } = await createSchoolWithYear();
    await service.create(school.id, {
      schoolYearId: schoolYear.id,
      name: '7A',
      shortName: '7A',
    });

    const found = await service.listBySchoolYear(school.id, schoolYear.id);

    expect(found.map((fg) => fg.name)).toEqual(['7A']);
  });

  it('throws NotFound updating a form group belonging to a different school', async () => {
    const { school, schoolYear } = await createSchoolWithYear();
    const { school: otherSchool } = await createSchoolWithYear();
    const formGroup = await service.create(school.id, {
      schoolYearId: schoolYear.id,
      name: '7A',
      shortName: '7A',
    });

    await expect(
      service.update(otherSchool.id, formGroup.id, { name: 'Hijacked' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('soft-removes a form group (recoverable, not a hard DELETE)', async () => {
    const { school, schoolYear } = await createSchoolWithYear();
    const formGroup = await service.create(school.id, {
      schoolYearId: schoolYear.id,
      name: '7A',
      shortName: '7A',
    });

    await service.remove(school.id, formGroup.id);

    expect(
      await service.listBySchoolYear(school.id, schoolYear.id),
    ).toHaveLength(0);
    const withDeleted = await formGroups.findOne({
      where: { id: formGroup.id },
      withDeleted: true,
    });
    expect(withDeleted).not.toBeNull();
    expect(withDeleted!.deletedAt).not.toBeNull();
  });
});
