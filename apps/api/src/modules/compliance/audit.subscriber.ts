import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import type {
  DataSource,
  EntitySubscriberInterface,
  InsertEvent,
  ObjectLiteral,
  RemoveEvent,
  SoftRemoveEvent,
  UpdateEvent,
} from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { AuditService } from './audit.service';

/**
 * Registered manually (dataSource.subscribers.push(this)) rather than via
 * TypeORM's `subscribers` DataSource option, so this can be a normal
 * Nest-DI-managed provider and constructor-inject AuditService like any
 * other service - TypeORM-option-registered subscribers are instantiated
 * by TypeORM itself and can't receive Nest-managed dependencies.
 *
 * Listens to every entity (no listenTo() override) except AuditLog itself,
 * to avoid auditing the audit trail. Only fires for repository-level
 * mutations (save/remove/softRemove) - a raw QueryBuilder .update()/
 * .delete() bypasses entity hooks entirely and will NOT reach this
 * subscriber; that call site must call AuditService.record() itself (see
 * audit.subscriber.spec.ts for a test proving both halves of this).
 */
@Injectable()
export class AuditSubscriber implements EntitySubscriberInterface {
  constructor(
    @InjectDataSource() dataSource: DataSource,
    private readonly auditService: AuditService,
  ) {
    dataSource.subscribers.push(this);
  }

  afterInsert(event: InsertEvent<ObjectLiteral>): Promise<void> | void {
    if (event.metadata.name === AuditLog.name) {
      return;
    }
    return this.auditService.record(event.manager, {
      action: 'insert',
      entityName: event.metadata.name,
      entityId: idOf(event.entity),
      before: null,
      after: event.entity ?? null,
    });
  }

  afterUpdate(event: UpdateEvent<ObjectLiteral>): Promise<void> | void {
    if (event.metadata.name === AuditLog.name) {
      return;
    }
    return this.auditService.record(event.manager, {
      action: 'update',
      entityName: event.metadata.name,
      entityId: idOf(event.entity) ?? idOf(event.databaseEntity),
      before: event.databaseEntity ?? null,
      after: event.entity ?? null,
    });
  }

  afterRemove(event: RemoveEvent<ObjectLiteral>): Promise<void> | void {
    if (event.metadata.name === AuditLog.name) {
      return;
    }
    return this.auditService.record(event.manager, {
      action: 'remove',
      entityName: event.metadata.name,
      entityId: idOf(event.databaseEntity) ?? idOf(event.entity),
      before: event.databaseEntity ?? null,
      after: null,
    });
  }

  afterSoftRemove(event: SoftRemoveEvent<ObjectLiteral>): Promise<void> | void {
    if (event.metadata.name === AuditLog.name) {
      return;
    }
    return this.auditService.record(event.manager, {
      action: 'soft-remove',
      entityName: event.metadata.name,
      entityId: idOf(event.entity) ?? idOf(event.databaseEntity),
      before: event.databaseEntity ?? null,
      after: event.entity ?? null,
    });
  }
}

function idOf(entity: ObjectLiteral | undefined | null): string | null {
  const id: unknown = entity?.id;
  return typeof id === 'string' ? id : null;
}
