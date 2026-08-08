import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { SoftDeletableEntity } from '../../../common/soft-deletable.entity';
import { School } from './school.entity';

@Entity('spaces')
@Index(['schoolId', 'name'], { unique: true })
export class Space extends SoftDeletableEntity {
  @ManyToOne(() => School, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'schoolId' })
  school: School;

  @Column({ type: 'varchar', length: 36 })
  schoolId: string;

  @Column({ type: 'varchar', length: 60 })
  name: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  type: string | null;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @Column({ type: 'boolean', default: true })
  bookable: boolean;

  @Column({ type: 'int', nullable: true })
  capacity: number | null;

  @Column({ type: 'boolean', default: false })
  hasComputer: boolean;

  @Column({ type: 'boolean', default: false })
  hasProjector: boolean;

  @Column({ type: 'boolean', default: false })
  hasTv: boolean;

  @Column({ type: 'boolean', default: false })
  hasDvd: boolean;

  @Column({ type: 'boolean', default: false })
  hasHifi: boolean;

  @Column({ type: 'boolean', default: false })
  hasSpeakers: boolean;

  @Column({ type: 'boolean', default: false })
  hasIwb: boolean;

  @Column({ type: 'int', nullable: true })
  computerStudentCount: number | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phoneInternal: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phoneExternal: string | null;

  @Column({ type: 'text', nullable: true })
  comment: string | null;
}
