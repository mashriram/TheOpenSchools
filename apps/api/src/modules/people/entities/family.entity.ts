import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import type { FamilyStatus } from '@purpleschools/shared-types';
import { SoftDeletableEntity } from '../../../common/soft-deletable.entity';
import { School } from '../../school/entities/school.entity';

@Entity('families')
export class Family extends SoftDeletableEntity {
  @ManyToOne(() => School, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'schoolId' })
  school: School;

  @Column({ type: 'varchar', length: 36 })
  schoolId: string;

  @Column({ type: 'varchar', length: 90 })
  name: string;

  @Column({ type: 'varchar', length: 90, nullable: true })
  nameAddress: string | null;

  @Column({ type: 'text', nullable: true })
  homeAddress: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  homeAddressDistrict: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  homeAddressCountry: string | null;

  @Column({ type: 'varchar', length: 20, default: 'Married' })
  status: FamilyStatus;

  @Column({ type: 'varchar', length: 30, nullable: true })
  languageHomePrimary: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  languageHomeSecondary: string | null;

  @Column({ type: 'boolean', default: false })
  familySync: boolean;

  @Column({ type: 'json', nullable: true })
  customFields: Record<string, unknown> | null;
}
