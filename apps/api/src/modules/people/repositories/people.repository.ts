import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Person } from '../entities/person.entity';

@Injectable()
export class PeopleRepository extends Repository<Person> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(Person, dataSource.createEntityManager());
  }

  findByEmail(schoolId: string, email: string): Promise<Person | null> {
    return this.findOne({ where: { schoolId, email } });
  }

  findBySchool(schoolId: string): Promise<Person[]> {
    return this.find({ where: { schoolId } });
  }
}
