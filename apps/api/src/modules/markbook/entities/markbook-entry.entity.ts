import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { MarkbookColumn } from './markbook-column.entity';
import { ScaleGrade } from './scale-grade.entity';
import { Person } from '../../people/entities/person.entity';

/** 'N' = no concern, 'Y' = below threshold, 'P' = exceeded personal target. */
export type MarkbookConcernFlag = 'N' | 'Y' | 'P';

/**
 * Gibbon's gibbonMarkbookEntry - one row per (column, student). File-upload
 * "response" attachments are deliberately not built: no module in this
 * codebase has a generic file-upload capability yet, and half-building one
 * just for Markbook would be scope creep: a documented deferral, not an
 * oversight.
 *
 * Tier A: ordinary educational record. No special encryption/retention
 * treatment beyond Foundation's existing baseline (see plan §Data Safety
 * Design A).
 *
 * No schoolId column: tenant scope is inherited through
 * `markbookColumn.courseClass.course.schoolId`.
 */
@Entity('markbook_entries')
@Index(['markbookColumnId', 'personId'], { unique: true })
export class MarkbookEntry extends BaseEntity {
  @ManyToOne(() => MarkbookColumn, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'markbookColumnId' })
  markbookColumn: MarkbookColumn;

  @Column({ type: 'varchar', length: 36 })
  markbookColumnId: string;

  @ManyToOne(() => Person, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'personId' })
  person: Person;

  @Column({ type: 'varchar', length: 36 })
  personId: string;

  @ManyToOne(() => ScaleGrade, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'attainmentScaleGradeId' })
  attainmentScaleGrade: ScaleGrade | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  attainmentScaleGradeId: string | null;

  @Column({ type: 'varchar', length: 1, default: 'N' })
  attainmentConcern: MarkbookConcernFlag;

  @ManyToOne(() => ScaleGrade, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'effortScaleGradeId' })
  effortScaleGrade: ScaleGrade | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  effortScaleGradeId: string | null;

  @Column({ type: 'varchar', length: 1, default: 'N' })
  effortConcern: MarkbookConcernFlag;

  @Column({ type: 'text', nullable: true })
  comment: string | null;
}
