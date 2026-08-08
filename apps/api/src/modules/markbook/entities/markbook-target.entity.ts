import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { CourseClass } from '../../curriculum/entities/course-class.entity';
import { Person } from '../../people/entities/person.entity';
import { ScaleGrade } from './scale-grade.entity';

/**
 * Gibbon's gibbonMarkbookTarget - one personal target grade per student per
 * class, used by the concern calculation in ../markbook-concern.ts in place
 * of the scale's generic `lowestAcceptable` threshold when set.
 *
 * `targetScaleGrade` uses onDelete: 'CASCADE', not 'RESTRICT': a Scale sits
 * above ScaleGrade in the same cascade-delete tree as School -> ... ->
 * Scale -> ScaleGrade, and a RESTRICT here blocks that whole-tenant
 * cascade the moment any MarkbookTarget references a grade (confirmed by a
 * failing integration test) - a personal target pointing at a deleted grade
 * is meaningless anyway, so cascading it away is correct, not just
 * convenient.
 *
 * No schoolId column: tenant scope is inherited through
 * `courseClass.course.schoolId`.
 */
@Entity('markbook_targets')
@Index(['courseClassId', 'personId'], { unique: true })
export class MarkbookTarget extends BaseEntity {
  @ManyToOne(() => CourseClass, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'courseClassId' })
  courseClass: CourseClass;

  @Column({ type: 'varchar', length: 36 })
  courseClassId: string;

  @ManyToOne(() => Person, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'personId' })
  person: Person;

  @Column({ type: 'varchar', length: 36 })
  personId: string;

  @ManyToOne(() => ScaleGrade, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'targetScaleGradeId' })
  targetScaleGrade: ScaleGrade;

  @Column({ type: 'varchar', length: 36 })
  targetScaleGradeId: string;
}
