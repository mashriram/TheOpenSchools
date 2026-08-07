import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { PersonEmergencyContact } from '../entities/person-emergency-contact.entity';

@Injectable()
export class PersonEmergencyContactsRepository extends Repository<PersonEmergencyContact> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(PersonEmergencyContact, dataSource.createEntityManager());
  }

  findByPerson(personId: string): Promise<PersonEmergencyContact[]> {
    return this.find({ where: { personId }, order: { priority: 'ASC' } });
  }
}
