import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { AttendanceCode } from './attendance-code.entity';
import { Role } from '../../rbac/entities/role.entity';

/**
 * The normalized replacement for Gibbon's `gibbonRoleIDAll` CSV column: one
 * row per (code, role) that's allowed to record this code. An
 * AttendanceCode with zero rows here is unrestricted - available to anyone
 * with ordinary attendance-recording permission - matching how a school
 * would set up its default codes (Present/Absent/Late) before narrowing
 * access to any sensitive additional codes it creates later.
 *
 * No schoolId column: tenant scope is inherited through
 * `attendanceCode.schoolId`.
 */
@Entity('attendance_code_roles')
@Index(['attendanceCodeId', 'roleId'], { unique: true })
export class AttendanceCodeRole extends BaseEntity {
  @ManyToOne(() => AttendanceCode, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'attendanceCodeId' })
  attendanceCode: AttendanceCode;

  @Column({ type: 'varchar', length: 36 })
  attendanceCodeId: string;

  @ManyToOne(() => Role, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'roleId' })
  role: Role;

  @Column({ type: 'varchar', length: 36 })
  roleId: string;
}
