import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { PersonRole } from '../entities/person-role.entity';

@Injectable()
export class PersonRolesRepository extends Repository<PersonRole> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(PersonRole, dataSource.createEntityManager());
  }

  findByPerson(personId: string): Promise<PersonRole[]> {
    return this.find({ where: { personId }, relations: { role: true } });
  }

  findPrimaryRole(personId: string): Promise<PersonRole | null> {
    return this.findOne({
      where: { personId, isPrimary: true },
      relations: { role: true },
    });
  }

  /** Used by Messenger (M23) to resolve a Role-type audience target. */
  findByRole(roleId: string): Promise<PersonRole[]> {
    return this.find({ where: { roleId } });
  }
}
