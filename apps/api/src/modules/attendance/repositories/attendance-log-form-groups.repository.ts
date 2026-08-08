import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { AttendanceLogFormGroup } from '../entities/attendance-log-form-group.entity';

@Injectable()
export class AttendanceLogFormGroupsRepository extends Repository<AttendanceLogFormGroup> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(AttendanceLogFormGroup, dataSource.createEntityManager());
  }

  findByFormGroupAndDate(
    formGroupId: string,
    date: string,
  ): Promise<AttendanceLogFormGroup | null> {
    return this.findOne({ where: { formGroupId, date } });
  }
}
