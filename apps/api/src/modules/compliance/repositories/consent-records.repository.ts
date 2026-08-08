import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ConsentRecord } from '../entities/consent-record.entity';

@Injectable()
export class ConsentRecordsRepository extends Repository<ConsentRecord> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(ConsentRecord, dataSource.createEntityManager());
  }

  findByPerson(personId: string): Promise<ConsentRecord[]> {
    return this.find({ where: { personId }, order: { acceptedAt: 'DESC' } });
  }
}
