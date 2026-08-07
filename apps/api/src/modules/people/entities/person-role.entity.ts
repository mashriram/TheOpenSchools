import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { Person } from './person.entity';
import { Role } from '../../rbac/entities/role.entity';

/**
 * Replaces gibbonPerson.gibbonRoleIDAll (a denormalized CSV string of role
 * ids) with a real many-to-many join table. `isPrimary` replaces
 * gibbonRoleIDPrimary.
 */
@Entity('person_roles')
@Index(['personId', 'roleId'], { unique: true })
export class PersonRole extends BaseEntity {
  @ManyToOne(() => Person, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'personId' })
  person: Person;

  @Column({ type: 'varchar', length: 36 })
  personId: string;

  @ManyToOne(() => Role, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'roleId' })
  role: Role;

  @Column({ type: 'varchar', length: 36 })
  roleId: string;

  @Column({ type: 'boolean', default: false })
  isPrimary: boolean;
}
