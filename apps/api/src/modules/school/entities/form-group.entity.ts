import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { SoftDeletableEntity } from '../../../common/soft-deletable.entity';
import { SchoolYear } from './school-year.entity';
import { Space } from './space.entity';

@Entity('form_groups')
@Index(['schoolYearId', 'name'], { unique: true })
export class FormGroup extends SoftDeletableEntity {
  @ManyToOne(() => SchoolYear, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'schoolYearId' })
  schoolYear: SchoolYear;

  @Column({ type: 'varchar', length: 36 })
  schoolYearId: string;

  @Column({ type: 'varchar', length: 60 })
  name: string;

  @Column({ type: 'varchar', length: 8 })
  shortName: string;

  @ManyToOne(() => Space, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'spaceId' })
  space: Space | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  spaceId: string | null;

  @ManyToOne(() => FormGroup, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'nextFormGroupId' })
  nextFormGroup: FormGroup | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  nextFormGroupId: string | null;

  @Column({ type: 'boolean', default: true })
  attendance: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  website: string | null;
}
