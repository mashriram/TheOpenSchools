import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { SoftDeletableEntity } from '../../../common/soft-deletable.entity';
import { School } from '../../school/entities/school.entity';
import { SchoolYear } from '../../school/entities/school-year.entity';
import { Department } from '../../school/entities/department.entity';

/**
 * Prerequisite entity for Timetable/Markbook/Attendance-by-class (Tier 2):
 * Gibbon's gibbonCourse, minus gibbonYearGroupIDList (normalized into the
 * CourseYearGroup join table, see that entity's doc comment).
 */
@Entity('courses')
@Index(['schoolId', 'schoolYearId', 'shortName'], { unique: true })
export class Course extends SoftDeletableEntity {
  @ManyToOne(() => School, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'schoolId' })
  school: School;

  @Column({ type: 'varchar', length: 36 })
  schoolId: string;

  @ManyToOne(() => SchoolYear, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'schoolYearId' })
  schoolYear: SchoolYear;

  @Column({ type: 'varchar', length: 36 })
  schoolYearId: string;

  @ManyToOne(() => Department, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'departmentId' })
  department: Department | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  departmentId: string | null;

  @Column({ type: 'varchar', length: 60 })
  name: string;

  @Column({ type: 'varchar', length: 16 })
  shortName: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  /** Maps from Gibbon's `map` enum('Y','N') flag. */
  @Column({ type: 'boolean', default: true })
  includeInCurriculumMaps: boolean;

  /** Maps from Gibbon's `orderBy` column. */
  @Column({ type: 'int', default: 0 })
  sequenceNumber: number;

  @Column({ type: 'json', nullable: true })
  customFields: Record<string, unknown> | null;
}
