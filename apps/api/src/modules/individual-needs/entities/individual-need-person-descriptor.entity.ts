import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import type {
  IndividualNeedDescriptorType,
  SafeguardingSeverityLevel,
} from '@purpleschools/shared-types';
import { BaseEntity } from '../../../common/base.entity';
import { Person } from '../../people/entities/person.entity';

/**
 * Gibbon's gibbonINPersonDescriptor, joined against a fixed 3-value
 * descriptor enum and a fixed 3-value severity level enum rather than
 * Gibbon's own gibbonINDescriptor/gibbonAlertLevel lookup tables - see
 * @purpleschools/shared-types' safeguarding.ts for why. `level` itself is
 * Tier A (a severity label, not narrative content) despite living on a
 * safeguarding-adjacent entity - only `IndividualNeed`'s free-text fields
 * are Tier C.
 *
 * No schoolId column: tenant scope is inherited through `person.schoolId`.
 */
@Entity('individual_need_person_descriptors')
@Index(['personId', 'descriptor'], { unique: true })
export class IndividualNeedPersonDescriptor extends BaseEntity {
  @ManyToOne(() => Person, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'personId' })
  person: Person;

  @Column({ type: 'varchar', length: 36 })
  personId: string;

  @Column({ type: 'varchar', length: 20 })
  descriptor: IndividualNeedDescriptorType;

  @Column({ type: 'varchar', length: 10, nullable: true })
  level: SafeguardingSeverityLevel | null;
}
