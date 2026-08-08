import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { School } from './school.entity';

/**
 * No soft-delete: a Setting row is config, not a record with retention/audit
 * weight - overwriting or hard-deleting it is fine, unlike People/Roles.
 */
@Entity('settings')
@Index(['schoolId', 'scope', 'name'], { unique: true })
export class Setting extends BaseEntity {
  @ManyToOne(() => School, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'schoolId' })
  school: School;

  @Column({ type: 'varchar', length: 36 })
  schoolId: string;

  @Column({ type: 'varchar', length: 40 })
  scope: string;

  @Column({ type: 'varchar', length: 60 })
  name: string;

  @Column({ type: 'varchar', length: 120 })
  nameDisplay: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'text', nullable: true })
  value: string | null;
}
