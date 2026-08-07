import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { Role } from './role.entity';
import { Action } from './action.entity';

@Entity('rbac_permissions')
@Index(['roleId', 'actionId'], { unique: true })
export class Permission extends BaseEntity {
  @ManyToOne(() => Role, (role) => role.permissions, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'roleId' })
  role: Role;

  @Column({ type: 'varchar', length: 36 })
  roleId: string;

  @ManyToOne(() => Action, (action) => action.permissions, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'actionId' })
  action: Action;

  @Column({ type: 'varchar', length: 36 })
  actionId: string;

  /**
   * Schema-ready for Tier 2's row-level ABAC rules (e.g. "a Teacher may view
   * a StudentEnrolment only within their own form group") - unused and
   * always null in this milestone. CASL's Ability supports conditions per
   * rule natively, so this costs one nullable column now instead of a
   * breaking migration later.
   */
  @Column({ type: 'json', nullable: true })
  conditions: Record<string, unknown> | null;
}
