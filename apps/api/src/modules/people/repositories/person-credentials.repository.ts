import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { PersonCredential } from '../entities/person-credential.entity';

@Injectable()
export class PersonCredentialsRepository extends Repository<PersonCredential> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(PersonCredential, dataSource.createEntityManager());
  }

  findByPersonId(personId: string): Promise<PersonCredential | null> {
    return this.findOne({ where: { personId } });
  }

  findByUsername(
    schoolId: string,
    username: string,
  ): Promise<PersonCredential | null> {
    return this.findOne({ where: { schoolId, username } });
  }
}
