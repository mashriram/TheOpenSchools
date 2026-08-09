import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { SoftDeletableEntity } from '../../../common/soft-deletable.entity';
import { School } from '../../school/entities/school.entity';

/**
 * Gibbon's gibbonCalendarEventType, renamed field `type` -> `name` for
 * clarity (a type's own name, not a type-of-type). Not auto-seeded at
 * signup - same deliberate deferral as AttendanceCode (M17)/AlertType
 * (M19): schools create their own event types via admin CRUD.
 */
@Entity('calendar_event_types')
@Index(['schoolId', 'name'], { unique: true })
export class CalendarEventType extends SoftDeletableEntity {
  @ManyToOne(() => School, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'schoolId' })
  school: School;

  @Column({ type: 'varchar', length: 36 })
  schoolId: string;

  @Column({ type: 'varchar', length: 60 })
  name: string;

  @Column({ type: 'varchar', length: 7, nullable: true })
  color: string | null;

  @Column({ type: 'int', default: 0 })
  sequenceNumber: number;
}
