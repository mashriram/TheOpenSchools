import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { SoftDeletableEntity } from '../../../common/soft-deletable.entity';
import { PlatformModule } from './platform-module.entity';
import { Permission } from './permission.entity';

@Entity('rbac_actions')
export class Action extends SoftDeletableEntity {
  @ManyToOne(() => PlatformModule, (module) => module.actions, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'moduleId' })
  module: PlatformModule;

  @Column({ type: 'varchar', length: 36 })
  moduleId: string;

  /**
   * Dot-namespaced human key (e.g. "schoolAdmin.schoolYears.manage") - the
   * durable, greppable, migration-safe identifier. A future Gibbon migrator
   * matches on this (plus category), never on Gibbon's gibbonActionID, which
   * is only unique per install.
   */
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 40 })
  category: string;

  @Column({ type: 'varchar', length: 255 })
  description: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  helpUrl: string | null;

  @Column({ type: 'int', default: 0 })
  precedence: number;

  @Column({ type: 'boolean', default: true })
  entrySidebar: boolean;

  @Column({ type: 'boolean', default: true })
  menuShow: boolean;

  /**
   * CASL action verb (e.g. "view", "manage", "export", "erase", "approve").
   * Deliberately a free-text column, not a closed union - Tier 2/3 modules
   * will keep inventing verbs Gibbon's own CRUD-shaped thinking didn't need.
   */
  @Column({ type: 'varchar', length: 40 })
  verb: string;

  /** CASL subject type (e.g. "Person", "Role", "SchoolYear"). Free-text. */
  @Column({ type: 'varchar', length: 60 })
  subject: string;

  @Column({ type: 'boolean', default: false })
  defaultPermissionAdmin: boolean;

  @Column({ type: 'boolean', default: false })
  defaultPermissionTeacher: boolean;

  @Column({ type: 'boolean', default: false })
  defaultPermissionStudent: boolean;

  @Column({ type: 'boolean', default: false })
  defaultPermissionParent: boolean;

  @Column({ type: 'boolean', default: false })
  defaultPermissionSupport: boolean;

  /**
   * Tier 2, M19: the fixed conditions this action's default grant carries,
   * applied uniformly to whichever role(s) receive it via the
   * defaultPermission* flags above (e.g. a `studentAlerts.alerts.
   * viewNonRestricted` action seeded with `{ alertTypeAdminOnly: false }`).
   * Unlike Permission.conditions (a per-grant value, still unused for
   * manually-edited custom-role permissions), this is a property of the
   * action itself - Gibbon's real design also splits a single conceptual
   * permission into several fixed-scope named actions
   * (`_all`/`_myChildren`/`_my`) rather than one action with a
   * role-varying condition. Null for every action that doesn't need scope
   * restriction (the overwhelming majority) - zero behavior change for
   * Foundation/M14-M18's existing catalogs.
   */
  @Column({ type: 'json', nullable: true })
  defaultConditions: Record<string, unknown> | null;

  @Column({ type: 'boolean', default: true })
  categoryPermissionStaff: boolean;

  @Column({ type: 'boolean', default: true })
  categoryPermissionStudent: boolean;

  @Column({ type: 'boolean', default: true })
  categoryPermissionParent: boolean;

  @Column({ type: 'boolean', default: true })
  categoryPermissionOther: boolean;

  @OneToMany(() => Permission, (permission) => permission.action)
  permissions: Permission[];
}
