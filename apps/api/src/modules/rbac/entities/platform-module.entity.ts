import { Column, Entity, Index, OneToMany } from 'typeorm';
import type { ModuleType } from '@purpleschools/shared-types';
import { SoftDeletableEntity } from '../../../common/soft-deletable.entity';
import { Action } from './action.entity';

/**
 * Named PlatformModule, not Module: `Module` is `@nestjs/common`'s decorator,
 * imported in nearly every Nest module file - reusing that name for an entity
 * would force aliasing everywhere. This is the global/platform-level catalog
 * of features PurpleSchools offers (Gibbon's gibbonModule, but shared across
 * every tenant rather than one-per-install).
 */
@Entity('rbac_modules')
export class PlatformModule extends SoftDeletableEntity {
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 60 })
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 20 })
  category: string;

  @Column({ type: 'varchar', length: 16, default: 'Core' })
  type: ModuleType;

  @Column({ type: 'varchar', length: 20, nullable: true })
  version: string | null;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @OneToMany(() => Action, (action) => action.module)
  actions: Action[];
}
