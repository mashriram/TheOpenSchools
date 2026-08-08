import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { TimetableYearGroup } from '../entities/timetable-year-group.entity';

@Injectable()
export class TimetableYearGroupsRepository extends Repository<TimetableYearGroup> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(TimetableYearGroup, dataSource.createEntityManager());
  }

  findByTimetable(timetableId: string): Promise<TimetableYearGroup[]> {
    return this.find({ where: { timetableId } });
  }
}
