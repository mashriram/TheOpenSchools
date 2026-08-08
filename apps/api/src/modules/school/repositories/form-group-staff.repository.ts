import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { FormGroupStaff } from '../entities/form-group-staff.entity';

@Injectable()
export class FormGroupStaffRepository extends Repository<FormGroupStaff> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(FormGroupStaff, dataSource.createEntityManager());
  }

  findByFormGroup(formGroupId: string): Promise<FormGroupStaff[]> {
    return this.find({
      where: { formGroupId },
      relations: { person: true },
      order: { priority: 'ASC' },
    });
  }
}
