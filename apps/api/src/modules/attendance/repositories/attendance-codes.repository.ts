import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { AttendanceCode } from '../entities/attendance-code.entity';

@Injectable()
export class AttendanceCodesRepository extends Repository<AttendanceCode> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(AttendanceCode, dataSource.createEntityManager());
  }

  findBySchool(schoolId: string): Promise<AttendanceCode[]> {
    return this.find({
      where: { schoolId },
      order: { sequenceNumber: 'ASC' },
    });
  }

  findByIdAndSchool(
    id: string,
    schoolId: string,
  ): Promise<AttendanceCode | null> {
    return this.findOne({ where: { id, schoolId } });
  }
}
