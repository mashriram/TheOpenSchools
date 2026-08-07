import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { SchoolYear } from '../entities/school-year.entity';

@Injectable()
export class SchoolYearsRepository extends Repository<SchoolYear> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(SchoolYear, dataSource.createEntityManager());
  }

  findBySchool(schoolId: string): Promise<SchoolYear[]> {
    return this.find({ where: { schoolId }, order: { sequenceNumber: 'ASC' } });
  }

  findCurrentForSchool(schoolId: string): Promise<SchoolYear | null> {
    return this.findOne({ where: { schoolId, status: 'Current' } });
  }
}
