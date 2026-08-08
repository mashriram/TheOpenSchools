import { randomUUID } from 'node:crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { SchoolModule } from './school.module';
import { SchoolsRepository } from './repositories/schools.repository';
import { SettingsRepository } from './repositories/settings.repository';
import { SettingsService } from './settings.service';

describe('SettingsService (integration)', () => {
  let module: TestingModule;
  let schools: SchoolsRepository;
  let settings: SettingsRepository;
  let service: SettingsService;
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
    settings = module.get(SettingsRepository);
    service = module.get(SettingsService);
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

  async function createSchool() {
    const school = await schools.save(
      schools.create({ name: 'Test School', subdomainSlug: randomUUID() }),
    );
    createdSchoolIds.push(school.id);
    return school;
  }

  const SETTING_DTO = {
    scope: 'System',
    name: 'organisationName',
    nameDisplay: 'Organisation Name',
    value: 'Greenwood High',
  };

  it('creates and lists a setting scoped to its school', async () => {
    const school = await createSchool();

    await service.create(school.id, SETTING_DTO);

    const found = await service.list(school.id);
    expect(found.map((s) => s.name)).toEqual(['organisationName']);
  });

  it('rejects a duplicate (scope, name) within the same school', async () => {
    const school = await createSchool();
    await service.create(school.id, SETTING_DTO);

    await expect(service.create(school.id, SETTING_DTO)).rejects.toThrow(
      ConflictException,
    );
  });

  it('allows the same (scope, name) across two different schools', async () => {
    const school = await createSchool();
    const otherSchool = await createSchool();
    await service.create(school.id, SETTING_DTO);

    await expect(
      service.create(otherSchool.id, SETTING_DTO),
    ).resolves.toBeDefined();
  });

  it('updates a setting value', async () => {
    const school = await createSchool();
    const setting = await service.create(school.id, SETTING_DTO);

    const updated = await service.update(school.id, setting.id, {
      value: 'Updated Name',
    });

    expect(updated.value).toBe('Updated Name');
  });

  it('throws NotFound updating a setting belonging to a different school', async () => {
    const school = await createSchool();
    const otherSchool = await createSchool();
    const setting = await service.create(school.id, SETTING_DTO);

    await expect(
      service.update(otherSchool.id, setting.id, { value: 'Hijacked' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('hard-removes a setting (no soft-delete)', async () => {
    const school = await createSchool();
    const setting = await service.create(school.id, SETTING_DTO);

    await service.remove(school.id, setting.id);

    expect(await settings.findOne({ where: { id: setting.id } })).toBeNull();
  });
});
