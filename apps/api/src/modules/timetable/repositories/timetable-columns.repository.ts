import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { TimetableColumn } from '../entities/timetable-column.entity';

@Injectable()
export class TimetableColumnsRepository extends Repository<TimetableColumn> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(TimetableColumn, dataSource.createEntityManager());
  }

  findBySchool(schoolId: string): Promise<TimetableColumn[]> {
    return this.find({ where: { schoolId }, order: { name: 'ASC' } });
  }

  findByIdAndSchool(
    id: string,
    schoolId: string,
  ): Promise<TimetableColumn | null> {
    return this.findOne({ where: { id, schoolId } });
  }
}
