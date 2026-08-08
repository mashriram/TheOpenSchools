import { Injectable } from '@nestjs/common';
import type { EntityManager } from 'typeorm';
import type { AuditAction } from '@purpleschools/shared-types';
import { RequestContextStore } from '../../common/request-context';
import { AuditLog } from './entities/audit-log.entity';
import { redactSensitiveFields } from './redact-sensitive-fields';

export interface RecordAuditEntryParams {
  action: AuditAction;
  entityName: string;
  entityId: string | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
}

/**
 * The single place an audit row gets written - AuditSubscriber calls this
 * for every entity mutation it sees, and any call site that bypasses the
 * ORM's entity hooks (a raw QueryBuilder bulk update, which subscribers
 * never fire for) is expected to call this explicitly instead. Takes the
 * manager as a parameter (rather than injecting a repository) so a caller
 * inside a transaction can pass its own transactional manager - writing
 * the audit row in the same transaction as the mutation it describes.
 */
@Injectable()
export class AuditService {
  async record(
    manager: EntityManager,
    params: RecordAuditEntryParams,
  ): Promise<void> {
    const context = RequestContextStore.get();
    const repo = manager.getRepository(AuditLog);
    await repo.save(
      repo.create({
        action: params.action,
        entityName: params.entityName,
        entityId: params.entityId,
        before: redactSensitiveFields(params.before),
        after: redactSensitiveFields(params.after),
        schoolId: context?.schoolId ?? null,
        actorPersonId: context?.actorPersonId ?? null,
      }),
    );
  }
}
