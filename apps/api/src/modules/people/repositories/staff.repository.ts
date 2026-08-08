import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Staff } from '../entities/staff.entity';

@Injectable()
export class StaffRepository extends Repository<Staff> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(Staff, dataSource.createEntityManager());
  }

  findByPersonId(personId: string): Promise<Staff | null> {
    return this.findOne({ where: { personId } });
  }
}
