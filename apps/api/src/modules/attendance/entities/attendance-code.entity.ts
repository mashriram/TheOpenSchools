import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { SoftDeletableEntity } from '../../../common/soft-deletable.entity';
import { School } from '../../school/entities/school.entity';

export type AttendanceCodeType = 'Core' | 'Additional';
export type AttendanceDirection = 'In' | 'Out';
export type AttendanceScope =
  'Onsite' | 'Onsite - Late' | 'Offsite' | 'Offsite - Left' | 'Offsite - Late';

/**
 * Gibbon's gibbonAttendanceCode, minus its `gibbonRoleIDAll` comma-separated
 * role-id list - that's a real Gibbon anti-pattern (a CSV string parsed at
 * query time), normalized here into the AttendanceCodeRole join table
 * instead, matching this codebase's established "declare a real join table,
 * don't store a CSV of ids" convention.
 */
@Entity('attendance_codes')
@Index(['schoolId', 'shortName'], { unique: true })
export class AttendanceCode extends SoftDeletableEntity {
  @ManyToOne(() => School, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'schoolId' })
  school: School;

  @Column({ type: 'varchar', length: 36 })
  schoolId: string;

  @Column({ type: 'varchar', length: 30 })
  name: string;

  @Column({ type: 'varchar', length: 4 })
  shortName: string;

  @Column({ type: 'varchar', length: 10, default: 'Additional' })
  type: AttendanceCodeType;

  @Column({ type: 'varchar', length: 3 })
  direction: AttendanceDirection;

  @Column({ type: 'varchar', length: 20 })
  scope: AttendanceScope;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @Column({ type: 'boolean', default: true })
  reportable: boolean;

  /** Renamed from Gibbon's bare `future` flag for clarity. */
  @Column({ type: 'boolean', default: false })
  allowFutureDate: boolean;

  @Column({ type: 'boolean', default: true })
  prefill: boolean;

  @Column({ type: 'int', default: 0 })
  sequenceNumber: number;
}
