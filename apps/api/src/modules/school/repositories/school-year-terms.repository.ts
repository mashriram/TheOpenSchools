import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { SchoolYearTerm } from '../entities/school-year-term.entity';

@Injectable()
export class SchoolYearTermsRepository extends Repository<SchoolYearTerm> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(SchoolYearTerm, dataSource.createEntityManager());
  }

  findBySchoolYear(schoolYearId: string): Promise<SchoolYearTerm[]> {
    return this.find({
      where: { schoolYearId },
      order: { sequenceNumber: 'ASC' },
    });
  }
}
