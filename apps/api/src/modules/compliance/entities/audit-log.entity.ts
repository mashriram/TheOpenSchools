import { Column, Entity, Index } from 'typeorm';
import type { AuditAction } from '@purpleschools/shared-types';
import { BaseEntity } from '../../../common/base.entity';

/**
 * Append-only - no update/delete endpoint anywhere, unlike Gibbon's
 * purgeable gibbonLog. schoolId/entityId/actorPersonId are plain columns,
 * not FKs: the log must survive independent of whether the referenced rows
 * still exist, and it covers every entity, not just one.
 */
@Entity('audit_logs')
@Index(['schoolId', 'createdAt'])
@Index(['entityName', 'entityId'])
export class AuditLog extends BaseEntity {
  @Column({ type: 'varchar', length: 36, nullable: true })
  schoolId: string | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  actorPersonId: string | null;

  @Column({ type: 'varchar', length: 20 })
  action: AuditAction;

  @Column({ type: 'varchar', length: 100 })
  entityName: string;

  @Column({ type: 'varchar', length: 36, nullable: true })
  entityId: string | null;

  @Column({ type: 'json', nullable: true })
  before: Record<string, unknown> | null;

  @Column({ type: 'json', nullable: true })
  after: Record<string, unknown> | null;
}
