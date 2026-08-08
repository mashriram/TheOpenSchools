import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Department } from '../entities/department.entity';

@Injectable()
export class DepartmentsRepository extends Repository<Department> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(Department, dataSource.createEntityManager());
  }

  findBySchool(schoolId: string): Promise<Department[]> {
    return this.find({
      where: { schoolId },
      order: { sequenceNumber: 'ASC' },
    });
  }
}
