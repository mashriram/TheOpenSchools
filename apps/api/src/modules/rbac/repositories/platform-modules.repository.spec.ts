import { randomUUID } from 'node:crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { QueryFailedError } from 'typeorm';
import { DatabaseModule } from '../../../database/database.module';
import { SchoolModule } from '../../school/school.module';
import { RbacModule } from '../rbac.module';
import { PlatformModulesRepository } from './platform-modules.repository';

describe('PlatformModulesRepository (integration)', () => {
  let module: TestingModule;
  let repository: PlatformModulesRepository;
  let createdIds: string[];

  beforeAll(async () => {
    // RbacModule's Role/SchoolModuleEnablement entities relate to School, so
    // SchoolModule must be in the graph too or TypeORM's metadata build
    // fails - manifesting as a misleading connection-retry loop, not a clean
    // error, since NestJS's TypeOrmCoreModule treats any DataSource init
    // failure as a connection problem.
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        DatabaseModule,
        SchoolModule,
        RbacModule,
      ],
    }).compile();

    repository = module.get(PlatformModulesRepository);
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(() => {
    createdIds = [];
  });

  afterEach(async () => {
    if (createdIds.length > 0) {
      await repository.delete(createdIds);
    }
  });

  async function createModule(overrides: Partial<{ name: string }> = {}) {
    const created = await repository.save(
      repository.create({
        name: randomUUID(),
        description: 'Test module',
        category: 'Admin',
        ...overrides,
      }),
    );
    createdIds.push(created.id);
    return created;
  }

  it('persists a module with the default type Core and active true', async () => {
    const created = await createModule();

    expect(created.type).toBe('Core');
    expect(created.active).toBe(true);
  });

  it('finds a module by its unique name', async () => {
    const name = randomUUID();
    await createModule({ name });

    const found = await repository.findByName(name);

    expect(found?.category).toBe('Admin');
  });

  it('returns null from findByName for an unknown name', async () => {
    expect(await repository.findByName(randomUUID())).toBeNull();
  });

  it('rejects a duplicate module name', async () => {
    const name = randomUUID();
    await createModule({ name });

    await expect(createModule({ name })).rejects.toThrow(QueryFailedError);
  });
});
