import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { FormGroup } from '../entities/form-group.entity';

@Injectable()
export class FormGroupsRepository extends Repository<FormGroup> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(FormGroup, dataSource.createEntityManager());
  }

  findBySchoolYear(schoolYearId: string): Promise<FormGroup[]> {
    return this.find({ where: { schoolYearId }, order: { name: 'ASC' } });
  }

  /**
   * FormGroup has no schoolId column of its own (it belongs to SchoolYear,
   * which belongs to School) - this loads the schoolYear relation so the
   * service layer can verify tenant ownership without a second query.
   */
  findByIdWithSchoolYear(id: string): Promise<FormGroup | null> {
    return this.findOne({ where: { id }, relations: { schoolYear: true } });
  }
}
