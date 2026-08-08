import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Space } from '../entities/space.entity';

@Injectable()
export class SpacesRepository extends Repository<Space> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(Space, dataSource.createEntityManager());
  }

  findBySchool(schoolId: string): Promise<Space[]> {
    return this.find({ where: { schoolId }, order: { name: 'ASC' } });
  }
}
