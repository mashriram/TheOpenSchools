import { DeleteDateColumn } from 'typeorm';
import { BaseEntity } from './base.entity';

/**
 * @DeleteDateColumn/softRemove for operational undo (per the plan's Compliance
 * design section) - this is not GDPR erasure, just a recoverable delete.
 */
export abstract class SoftDeletableEntity extends BaseEntity {
  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deletedAt: Date | null;
}
