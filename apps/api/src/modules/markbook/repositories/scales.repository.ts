import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Scale } from '../entities/scale.entity';

@Injectable()
export class ScalesRepository extends Repository<Scale> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(Scale, dataSource.createEntityManager());
  }

  findBySchool(schoolId: string): Promise<Scale[]> {
    return this.find({ where: { schoolId }, order: { name: 'ASC' } });
  }

  findByIdAndSchool(id: string, schoolId: string): Promise<Scale | null> {
    return this.findOne({ where: { id, schoolId } });
  }
}
