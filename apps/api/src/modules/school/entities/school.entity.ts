import { Column, Entity, Index, OneToMany } from 'typeorm';
import type { SchoolPlanTier, SchoolStatus } from '@purpleschools/shared-types';
import { SoftDeletableEntity } from '../../../common/soft-deletable.entity';
import { SchoolYear } from './school-year.entity';

@Entity('schools')
export class School extends SoftDeletableEntity {
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 63 })
  subdomainSlug: string;

  @Column({ type: 'varchar', length: 32, default: 'PendingVerification' })
  status: SchoolStatus;

  @Column({ type: 'varchar', length: 32, default: 'Free' })
  planTier: SchoolPlanTier;

  @Column({ type: 'varchar', length: 64, nullable: true })
  dataResidencyRegion: string | null;

  @OneToMany(() => SchoolYear, (schoolYear) => schoolYear.school)
  schoolYears: SchoolYear[];
}
