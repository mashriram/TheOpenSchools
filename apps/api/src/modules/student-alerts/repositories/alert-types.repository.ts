import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { AlertType } from '../entities/alert-type.entity';

@Injectable()
export class AlertTypesRepository extends Repository<AlertType> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(AlertType, dataSource.createEntityManager());
  }

  findBySchool(schoolId: string): Promise<AlertType[]> {
    return this.find({ where: { schoolId }, order: { sequenceNumber: 'ASC' } });
  }

  findByIdAndSchool(id: string, schoolId: string): Promise<AlertType | null> {
    return this.findOne({ where: { id, schoolId } });
  }
}
