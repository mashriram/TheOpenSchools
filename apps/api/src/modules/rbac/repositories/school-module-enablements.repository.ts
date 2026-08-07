import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { SchoolModuleEnablement } from '../entities/school-module-enablement.entity';

@Injectable()
export class SchoolModuleEnablementsRepository extends Repository<SchoolModuleEnablement> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(SchoolModuleEnablement, dataSource.createEntityManager());
  }

  findBySchool(schoolId: string): Promise<SchoolModuleEnablement[]> {
    return this.find({ where: { schoolId }, relations: { module: true } });
  }

  findEnabledModuleIds(schoolId: string): Promise<string[]> {
    return this.find({ where: { schoolId, enabled: true } }).then((rows) =>
      rows.map((row) => row.moduleId),
    );
  }
}
