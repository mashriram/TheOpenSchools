import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { AttendanceCodeRole } from '../entities/attendance-code-role.entity';

@Injectable()
export class AttendanceCodeRolesRepository extends Repository<AttendanceCodeRole> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(AttendanceCodeRole, dataSource.createEntityManager());
  }

  findByCode(attendanceCodeId: string): Promise<AttendanceCodeRole[]> {
    return this.find({ where: { attendanceCodeId } });
  }
}
