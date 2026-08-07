import { randomUUID } from 'node:crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { QueryFailedError } from 'typeorm';
import { DatabaseModule } from '../../../database/database.module';
import { SchoolModule } from '../school.module';
import { SchoolsRepository } from './schools.repository';
import { School } from '../entities/school.entity';

describe('SchoolsRepository (integration)', () => {
  let module: TestingModule;
  let repository: SchoolsRepository;
  let createdIds: string[];

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        DatabaseModule,
        SchoolModule,
      ],
    }).compile();

    repository = module.get(SchoolsRepository);
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

  async function createSchool(
    overrides: Partial<School> = {},
  ): Promise<School> {
    const school = await repository.save(
      repository.create({
        name: 'Test School',
        subdomainSlug: randomUUID(),
        ...overrides,
      }),
    );
    createdIds.push(school.id);
    return school;
  }

  it('persists a school and generates an id/createdAt/updatedAt', async () => {
    const school = await createSchool({ name: 'Greenwood High' });

    expect(school.id).toBeDefined();
    expect(school.createdAt).toBeInstanceOf(Date);
    expect(school.updatedAt).toBeInstanceOf(Date);
  });

  it('applies the default status and planTier when not provided', async () => {
    const school = await createSchool({ name: 'Riverside Academy' });

    expect(school.status).toBe('PendingVerification');
    expect(school.planTier).toBe('Free');
  });

  it('finds a school by its subdomain slug', async () => {
    const school = await createSchool({ name: 'Lakeside School' });

    const found = await repository.findBySlug(school.subdomainSlug);

    expect(found?.name).toBe('Lakeside School');
  });

  it('returns null from findBySlug when no school has that slug', async () => {
    const found = await repository.findBySlug(randomUUID());

    expect(found).toBeNull();
  });

  it('rejects a duplicate subdomain slug', async () => {
    const first = await createSchool({ name: 'First School' });

    await expect(
      repository.save(
        repository.create({
          name: 'Second School',
          subdomainSlug: first.subdomainSlug,
        }),
      ),
    ).rejects.toThrow(QueryFailedError);
  });

  it('excludes soft-deleted schools from findBySlug', async () => {
    const school = await createSchool({ name: 'Closing School' });

    await repository.softRemove(school);

    expect(await repository.findBySlug(school.subdomainSlug)).toBeNull();
  });

  it('sets deletedAt on soft-remove but keeps the row in the database', async () => {
    const school = await createSchool({ name: 'To Be Closed' });

    await repository.softRemove(school);

    const stillThere = await repository.findOne({
      where: { id: school.id },
      withDeleted: true,
    });
    expect(stillThere?.deletedAt).toBeInstanceOf(Date);
  });
});
