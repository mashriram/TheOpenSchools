import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Setting } from '../entities/setting.entity';

@Injectable()
export class SettingsRepository extends Repository<Setting> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(Setting, dataSource.createEntityManager());
  }

  findBySchool(schoolId: string): Promise<Setting[]> {
    return this.find({
      where: { schoolId },
      order: { scope: 'ASC', name: 'ASC' },
    });
  }

  findBySchoolScopeAndName(
    schoolId: string,
    scope: string,
    name: string,
  ): Promise<Setting | null> {
    return this.findOne({ where: { schoolId, scope, name } });
  }
}
