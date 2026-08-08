import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { SoftDeletableEntity } from '../../../common/soft-deletable.entity';
import { Space } from '../../school/entities/space.entity';
import { Person } from '../../people/entities/person.entity';

/**
 * An ad hoc room booking outside the regular timetable. Gibbon's real
 * gibbonTTSpaceBooking has a polymorphic foreignKey
 * enum('gibbonSpaceID','gibbonLibraryItemID') + foreignKeyID - simplified
 * to a direct spaceId FK only, since PurpleSchools has no Library module
 * yet (Tier 3+). No schoolId column - scoped through space.schoolId.
 */
@Entity('facility_bookings')
export class FacilityBooking extends SoftDeletableEntity {
  @ManyToOne(() => Space, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'spaceId' })
  space: Space;

  @Column({ type: 'varchar', length: 36 })
  spaceId: string;

  @ManyToOne(() => Person, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'personId' })
  person: Person;

  @Column({ type: 'varchar', length: 36 })
  personId: string;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'time' })
  timeStart: string;

  @Column({ type: 'time' })
  timeEnd: string;

  @Column({ type: 'varchar', length: 255 })
  reason: string;
}
