import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import type { DepartmentType } from '@purpleschools/shared-types';
import { SoftDeletableEntity } from '../../../common/soft-deletable.entity';
import { School } from './school.entity';

@Entity('departments')
@Index(['schoolId', 'name'], { unique: true })
export class Department extends SoftDeletableEntity {
  @ManyToOne(() => School, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'schoolId' })
  school: School;

  @Column({ type: 'varchar', length: 36 })
  schoolId: string;

  @Column({ type: 'varchar', length: 20 })
  type: DepartmentType;

  @Column({ type: 'varchar', length: 60 })
  name: string;

  @Column({ type: 'varchar', length: 8 })
  shortName: string;

  @Column({ type: 'text', nullable: true })
  subjectListing: string | null;

  @Column({ type: 'text', nullable: true })
  blurb: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  logoUrl: string | null;

  @Column({ type: 'int', default: 0 })
  sequenceNumber: number;

  @Column({ type: 'json', nullable: true })
  customFields: Record<string, unknown> | null;
}
