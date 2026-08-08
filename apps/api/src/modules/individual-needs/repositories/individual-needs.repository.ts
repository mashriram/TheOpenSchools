import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { IndividualNeed } from '../entities/individual-need.entity';

@Injectable()
export class IndividualNeedsRepository extends Repository<IndividualNeed> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(IndividualNeed, dataSource.createEntityManager());
  }

  findByPerson(personId: string): Promise<IndividualNeed | null> {
    return this.findOne({ where: { personId } });
  }

  /** Joins IndividualNeed -> Person to enforce tenant scope. */
  findByIdAndSchool(
    id: string,
    schoolId: string,
  ): Promise<IndividualNeed | null> {
    return this.createQueryBuilder('need')
      .innerJoin('need.person', 'person')
      .where('need.id = :id AND person.schoolId = :schoolId', { id, schoolId })
      .getOne();
  }
}
