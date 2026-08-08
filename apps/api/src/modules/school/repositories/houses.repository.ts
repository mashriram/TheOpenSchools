import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { House } from '../entities/house.entity';

@Injectable()
export class HousesRepository extends Repository<House> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(House, dataSource.createEntityManager());
  }

  findBySchool(schoolId: string): Promise<House[]> {
    return this.find({ where: { schoolId }, order: { name: 'ASC' } });
  }
}
