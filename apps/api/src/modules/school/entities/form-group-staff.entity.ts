import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import type { FormGroupStaffRole } from '@purpleschools/shared-types';
import { BaseEntity } from '../../../common/base.entity';
import { FormGroup } from './form-group.entity';
import { Person } from '../../people/entities/person.entity';

/**
 * Replaces gibbonFormGroup's 6 numbered tutor/EA columns
 * (gibbonPersonIDTutor/Tutor2/Tutor3/EA/EA2/EA3) with a real join table.
 */
@Entity('form_group_staff')
@Index(['formGroupId', 'personId'], { unique: true })
export class FormGroupStaff extends BaseEntity {
  @ManyToOne(() => FormGroup, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'formGroupId' })
  formGroup: FormGroup;

  @Column({ type: 'varchar', length: 36 })
  formGroupId: string;

  @ManyToOne(() => Person, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'personId' })
  person: Person;

  @Column({ type: 'varchar', length: 36 })
  personId: string;

  @Column({ type: 'varchar', length: 20 })
  role: FormGroupStaffRole;

  @Column({ type: 'int', default: 0 })
  priority: number;
}
