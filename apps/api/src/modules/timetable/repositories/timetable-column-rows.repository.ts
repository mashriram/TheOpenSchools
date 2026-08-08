import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { TimetableColumnRow } from '../entities/timetable-column-row.entity';

@Injectable()
export class TimetableColumnRowsRepository extends Repository<TimetableColumnRow> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(TimetableColumnRow, dataSource.createEntityManager());
  }

  findByColumn(timetableColumnId: string): Promise<TimetableColumnRow[]> {
    return this.find({
      where: { timetableColumnId },
      order: { timeStart: 'ASC' },
    });
  }

  findByIdAndSchool(
    id: string,
    schoolId: string,
  ): Promise<TimetableColumnRow | null> {
    return this.createQueryBuilder('row')
      .innerJoin('row.timetableColumn', 'column')
      .where('row.id = :id', { id })
      .andWhere('column.schoolId = :schoolId', { schoolId })
      .getOne();
  }
}
