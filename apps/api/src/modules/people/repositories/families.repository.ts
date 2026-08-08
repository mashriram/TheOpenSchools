import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Family } from '../entities/family.entity';

@Injectable()
export class FamiliesRepository extends Repository<Family> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(Family, dataSource.createEntityManager());
  }

  findBySchool(schoolId: string): Promise<Family[]> {
    return this.find({ where: { schoolId }, order: { name: 'ASC' } });
  }
}
