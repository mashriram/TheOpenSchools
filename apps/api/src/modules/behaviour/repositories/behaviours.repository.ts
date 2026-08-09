import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Behaviour, BehaviourType } from '../entities/behaviour.entity';

@Injectable()
export class BehavioursRepository extends Repository<Behaviour> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(Behaviour, dataSource.createEntityManager());
  }

  findByPerson(personId: string): Promise<Behaviour[]> {
    return this.find({ where: { personId }, order: { date: 'DESC' } });
  }

  countByPersonAndType(personId: string, type: BehaviourType): Promise<number> {
    return this.count({ where: { personId, type } });
  }

  /** Joins Behaviour -> SchoolYear to enforce tenant scope. */
  findByIdAndSchool(id: string, schoolId: string): Promise<Behaviour | null> {
    return this.createQueryBuilder('behaviour')
      .innerJoin('behaviour.schoolYear', 'schoolYear')
      .where('behaviour.id = :id AND schoolYear.schoolId = :schoolId', {
        id,
        schoolId,
      })
      .getOne();
  }
}
