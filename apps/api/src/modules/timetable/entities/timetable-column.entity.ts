import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { SoftDeletableEntity } from '../../../common/soft-deletable.entity';
import { School } from '../../school/entities/school.entity';

/**
 * A reusable period-pattern (e.g. "Week A period structure"). Gibbon's real
 * gibbonTTColumn table has no FK to anything - it's shared school-wide, not
 * tied to a specific Timetable/SchoolYear. schoolId is added here purely as
 * this entity's multi-tenancy scoping root (Gibbon is single-tenant).
 */
@Entity('timetable_columns')
@Index(['schoolId', 'shortName'], { unique: true })
export class TimetableColumn extends SoftDeletableEntity {
  @ManyToOne(() => School, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'schoolId' })
  school: School;

  @Column({ type: 'varchar', length: 36 })
  schoolId: string;

  @Column({ type: 'varchar', length: 30 })
  name: string;

  @Column({ type: 'varchar', length: 12 })
  shortName: string;
}
