import { randomUUID } from 'node:crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { DatabaseModule } from '../../database/database.module';
import { SchoolModule } from '../school/school.module';
import { PeopleModule } from '../people/people.module';
import { RbacModule } from '../rbac/rbac.module';
import { ComplianceModule } from './compliance.module';
import { SchoolsRepository } from '../school/repositories/schools.repository';
import { PeopleRepository } from '../people/repositories/people.repository';
import { PersonCredentialsRepository } from '../people/repositories/person-credentials.repository';
import { AuditLogsRepository } from './repositories/audit-logs.repository';
import { AuditService } from './audit.service';
import { RequestContextStore } from '../../common/request-context';

describe('AuditSubscriber (integration)', () => {
  let module: TestingModule;
  let dataSource: DataSource;
  let schools: SchoolsRepository;
  let people: PeopleRepository;
  let personCredentials: PersonCredentialsRepository;
  let auditLogs: AuditLogsRepository;
  let auditService: AuditService;
  let createdSchoolIds: string[];

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        DatabaseModule,
        SchoolModule,
        PeopleModule,
        RbacModule,
        ComplianceModule,
      ],
    }).compile();

    dataSource = module.get(DataSource);
    schools = module.get(SchoolsRepository);
    people = module.get(PeopleRepository);
    personCredentials = module.get(PersonCredentialsRepository);
    auditLogs = module.get(AuditLogsRepository);
    auditService = module.get(AuditService);
    // AuditSubscriber isn't referenced anywhere in this file, but Nest
    // eagerly instantiates every provider a module declares -
    // ComplianceModule lists it in `providers`, and that instantiation is
    // what runs its constructor's `dataSource.subscribers.push(this)`.
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(() => {
    createdSchoolIds = [];
  });

  afterEach(async () => {
    // Deliberately does NOT delete audit_logs rows: schools/people are
    // tenant data and get cleaned up per-test as always, but the audit
    // trail is append-only, unscoped, real infrastructure (like the
    // Foundation RBAC catalog) - it's expected to accumulate across the
    // whole test suite, not be reset per test. Each assertion below
    // queries for a fresh random entity id, so this doesn't affect
    // test isolation.
    if (createdSchoolIds.length > 0) {
      await schools.delete(createdSchoolIds);
    }
  });

  it('creates an audit row on insert, with before=null', async () => {
    const school = await schools.save(
      schools.create({ name: 'Greenwood High', subdomainSlug: randomUUID() }),
    );
    createdSchoolIds.push(school.id);

    const rows = await auditLogs.findByEntity('School', school.id);

    expect(rows).toHaveLength(1);
    expect(rows[0].action).toBe('insert');
    expect(rows[0].before).toBeNull();
    expect((rows[0].after as { name: string }).name).toBe('Greenwood High');
  });

  it('creates an audit row on update, capturing before and after', async () => {
    const school = await schools.save(
      schools.create({ name: 'Greenwood High', subdomainSlug: randomUUID() }),
    );
    createdSchoolIds.push(school.id);

    school.name = 'Greenwood Academy';
    await schools.save(school);

    const rows = await auditLogs.findByEntity('School', school.id);
    const updateRow = rows.find((r) => r.action === 'update');

    expect(updateRow).toBeDefined();
    expect((updateRow!.before as { name: string }).name).toBe('Greenwood High');
    expect((updateRow!.after as { name: string }).name).toBe(
      'Greenwood Academy',
    );
  });

  it('creates an audit row on soft-remove', async () => {
    const school = await schools.save(
      schools.create({ name: 'Greenwood High', subdomainSlug: randomUUID() }),
    );
    createdSchoolIds.push(school.id);

    await schools.softRemove(school);

    const rows = await auditLogs.findByEntity('School', school.id);
    expect(rows.some((r) => r.action === 'soft-remove')).toBe(true);
  });

  it('redacts passwordHash and mfaSecret in a PersonCredential audit row', async () => {
    const school = await schools.save(
      schools.create({ name: 'Greenwood High', subdomainSlug: randomUUID() }),
    );
    createdSchoolIds.push(school.id);
    const person = await people.save(
      people.create({ schoolId: school.id, surname: 'Smith', firstName: 'Jo' }),
    );
    const credential = await personCredentials.save(
      personCredentials.create({
        personId: person.id,
        schoolId: school.id,
        username: 'jo@example.com',
        passwordHash: 'argon2id$real-hash-value',
        mfaSecret: 'real-totp-seed',
      }),
    );

    const rows = await auditLogs.findByEntity(
      'PersonCredential',
      credential.id,
    );
    expect(rows).toHaveLength(1);
    const after = rows[0].after as Record<string, unknown>;
    expect(after.passwordHash).toBe('[REDACTED]');
    expect(after.mfaSecret).toBe('[REDACTED]');
    expect(after.username).toBe('jo@example.com');
  });

  it('attributes the actor/school from RequestContextStore when set', async () => {
    const actorPersonId = randomUUID();
    const schoolIdForContext = randomUUID();

    const school = await RequestContextStore.run(
      { schoolId: schoolIdForContext, actorPersonId },
      () =>
        schools.save(
          schools.create({
            name: 'Greenwood High',
            subdomainSlug: randomUUID(),
          }),
        ),
    );
    createdSchoolIds.push(school.id);

    const rows = await auditLogs.findByEntity('School', school.id);
    expect(rows[0].actorPersonId).toBe(actorPersonId);
    expect(rows[0].schoolId).toBe(schoolIdForContext);
  });

  it('does NOT audit a raw QueryBuilder bulk update - a real, documented limitation', async () => {
    const school = await schools.save(
      schools.create({ name: 'Greenwood High', subdomainSlug: randomUUID() }),
    );
    createdSchoolIds.push(school.id);
    const rowsAfterInsert = await auditLogs.findByEntity('School', school.id);
    expect(rowsAfterInsert).toHaveLength(1);

    // Bypasses entity hooks entirely - TypeORM subscribers never fire for
    // QueryBuilder-based bulk operations, only for repository.save()/
    // .remove()/.softRemove().
    await schools
      .createQueryBuilder()
      .update()
      .set({ name: 'Bulk Renamed' })
      .where('id = :id', { id: school.id })
      .execute();

    const rowsAfterBulkUpdate = await auditLogs.findByEntity(
      'School',
      school.id,
    );
    expect(rowsAfterBulkUpdate).toHaveLength(1);
    expect(rowsAfterBulkUpdate.some((r) => r.action === 'update')).toBe(false);
  });

  it('is auditable if the bulk-update call site calls AuditService.record() explicitly instead', async () => {
    const school = await schools.save(
      schools.create({ name: 'Greenwood High', subdomainSlug: randomUUID() }),
    );
    createdSchoolIds.push(school.id);

    await schools
      .createQueryBuilder()
      .update()
      .set({ name: 'Bulk Renamed' })
      .where('id = :id', { id: school.id })
      .execute();
    // The workaround: the call site that chose to bypass the ORM's entity
    // hooks is responsible for calling AuditService directly.
    await auditService.record(dataSource.manager, {
      action: 'update',
      entityName: 'School',
      entityId: school.id,
      before: { name: 'Greenwood High' },
      after: { name: 'Bulk Renamed' },
    });

    const rows = await auditLogs.findByEntity('School', school.id);
    expect(rows.some((r) => r.action === 'update')).toBe(true);
  });
});
