import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { SoftDeletableEntity } from '../../../common/soft-deletable.entity';
import { SchoolYear } from '../../school/entities/school-year.entity';

/**
 * Gibbon's gibbonCalendar - visibility lives entirely on this parent
 * container (five `viewable*`/`public` flags), never per-event; an event
 * gets per-person visibility only via the separate CalendarEventPerson
 * join and `viewableParticipants` (plan §M22). See
 * CalendarAccessService.canViewCalendar() for the resolution logic.
 *
 * No schoolId column: tenant scope is inherited through
 * `schoolYear.schoolId`.
 */
@Entity('calendars')
@Index(['schoolYearId', 'name'], { unique: true })
export class Calendar extends SoftDeletableEntity {
  @ManyToOne(() => SchoolYear, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'schoolYearId' })
  schoolYear: SchoolYear;

  @Column({ type: 'varchar', length: 36 })
  schoolYearId: string;

  @Column({ type: 'varchar', length: 60 })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string | null;

  @Column({ type: 'text', nullable: true })
  summary: string | null;

  @Column({ type: 'varchar', length: 7, nullable: true })
  color: string | null;

  @Column({ type: 'boolean', default: false })
  public: boolean;

  @Column({ type: 'boolean', default: false })
  viewableStaff: boolean;

  @Column({ type: 'boolean', default: false })
  viewableStudents: boolean;

  @Column({ type: 'boolean', default: false })
  viewableParents: boolean;

  @Column({ type: 'boolean', default: false })
  viewableOther: boolean;

  /** Grants visibility to a specific event's own CalendarEventPerson rows, regardless of the flags above. */
  @Column({ type: 'boolean', default: false })
  viewableParticipants: boolean;

  /** Whether ordinary staff (not just this calendar's named CalendarEditors) may add events. */
  @Column({ type: 'boolean', default: false })
  editableStaff: boolean;

  @Column({ type: 'int', default: 0 })
  sequenceNumber: number;
}
