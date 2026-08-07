import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { PersonPhone } from '../entities/person-phone.entity';

@Injectable()
export class PersonPhonesRepository extends Repository<PersonPhone> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(PersonPhone, dataSource.createEntityManager());
  }

  findByPerson(personId: string): Promise<PersonPhone[]> {
    return this.find({ where: { personId }, order: { priority: 'ASC' } });
  }
}
