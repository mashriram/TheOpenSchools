import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { School } from '../../school/entities/school.entity';
import { PlatformModule } from './platform-module.entity';

/**
 * Per-school module enablement - genuinely new scope beyond Gibbon, which
 * never needed per-install feature toggling (every install got every
 * module). A multi-tenant SaaS with School.planTier already on the books
 * needs this: gating a future paid-tier module behind a plan is a row here,
 * not a redesign.
 */
@Entity('school_module_enablements')
@Index(['schoolId', 'moduleId'], { unique: true })
export class SchoolModuleEnablement extends BaseEntity {
  @ManyToOne(() => School, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'schoolId' })
  school: School;

  @Column({ type: 'varchar', length: 36 })
  schoolId: string;

  @ManyToOne(() => PlatformModule, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'moduleId' })
  module: PlatformModule;

  @Column({ type: 'varchar', length: 36 })
  moduleId: string;

  @Column({ type: 'boolean', default: true })
  enabled: boolean;

  @Column({ type: 'timestamp', nullable: true })
  enabledAt: Date | null;
}
