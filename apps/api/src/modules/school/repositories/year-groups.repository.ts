import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { YearGroup } from '../entities/year-group.entity';

@Injectable()
export class YearGroupsRepository extends Repository<YearGroup> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(YearGroup, dataSource.createEntityManager());
  }

  findBySchool(schoolId: string): Promise<YearGroup[]> {
    return this.find({
      where: { schoolId },
      order: { sequenceNumber: 'ASC' },
    });
  }
}
