import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import type {
  RoleCategory,
  RoleRestriction,
  RoleType,
} from '@purpleschools/shared-types';
import { SoftDeletableEntity } from '../../../common/soft-deletable.entity';
import { School } from '../../school/entities/school.entity';
import { Permission } from './permission.entity';

@Entity('rbac_roles')
@Index(['schoolId', 'name'], { unique: true })
export class Role extends SoftDeletableEntity {
  @ManyToOne(() => School, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'schoolId' })
  school: School;

  @Column({ type: 'varchar', length: 36 })
  schoolId: string;

  @Column({ type: 'varchar', length: 16 })
  category: RoleCategory;

  @Column({ type: 'varchar', length: 40 })
  name: string;

  @Column({ type: 'varchar', length: 8 })
  shortName: string;

  @Column({ type: 'varchar', length: 120 })
  description: string;

  @Column({ type: 'varchar', length: 16, default: 'Core' })
  type: RoleType;

  @Column({ type: 'boolean', default: true })
  canLogin: boolean;

  @Column({ type: 'boolean', default: true })
  futureYearsLogin: boolean;

  @Column({ type: 'boolean', default: true })
  pastYearsLogin: boolean;

  @Column({ type: 'varchar', length: 16, default: 'None' })
  restriction: RoleRestriction;

  @OneToMany(() => Permission, (permission) => permission.role)
  permissions: Permission[];
}
