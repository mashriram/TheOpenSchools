import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { BehaviourLetterSnapshot } from '../entities/behaviour-letter-snapshot.entity';

@Injectable()
export class BehaviourLetterSnapshotsRepository extends Repository<BehaviourLetterSnapshot> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(BehaviourLetterSnapshot, dataSource.createEntityManager());
  }

  findByPerson(personId: string): Promise<BehaviourLetterSnapshot[]> {
    return this.find({ where: { personId }, order: { sentAt: 'DESC' } });
  }

  /** Joins BehaviourLetterSnapshot -> SchoolYear to enforce tenant scope. */
  findByIdAndSchool(
    id: string,
    schoolId: string,
  ): Promise<BehaviourLetterSnapshot | null> {
    return this.createQueryBuilder('snapshot')
      .innerJoin('snapshot.schoolYear', 'schoolYear')
      .where('snapshot.id = :id AND schoolYear.schoolId = :schoolId', {
        id,
        schoolId,
      })
      .getOne();
  }
}
