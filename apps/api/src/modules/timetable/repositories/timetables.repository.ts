import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Timetable } from '../entities/timetable.entity';

@Injectable()
export class TimetablesRepository extends Repository<Timetable> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(Timetable, dataSource.createEntityManager());
  }

  findBySchool(schoolId: string, schoolYearId?: string): Promise<Timetable[]> {
    return this.find({
      where: schoolYearId ? { schoolId, schoolYearId } : { schoolId },
      order: { name: 'ASC' },
    });
  }

  findByIdAndSchool(id: string, schoolId: string): Promise<Timetable | null> {
    return this.findOne({ where: { id, schoolId } });
  }

  findActiveBySchool(schoolId: string): Promise<Timetable[]> {
    return this.find({ where: { schoolId, active: true } });
  }
}
