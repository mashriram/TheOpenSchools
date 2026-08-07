import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Role } from '../entities/role.entity';

@Injectable()
export class RolesRepository extends Repository<Role> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(Role, dataSource.createEntityManager());
  }

  findBySchool(schoolId: string): Promise<Role[]> {
    return this.find({ where: { schoolId } });
  }

  findBySchoolAndName(schoolId: string, name: string): Promise<Role | null> {
    return this.findOne({ where: { schoolId, name } });
  }
}
