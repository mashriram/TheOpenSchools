import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { BehaviourFollowUp } from '../entities/behaviour-follow-up.entity';

@Injectable()
export class BehaviourFollowUpsRepository extends Repository<BehaviourFollowUp> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(BehaviourFollowUp, dataSource.createEntityManager());
  }

  findByBehaviour(behaviourId: string): Promise<BehaviourFollowUp[]> {
    return this.find({ where: { behaviourId }, order: { createdAt: 'ASC' } });
  }

  /** Joins BehaviourFollowUp -> Behaviour -> SchoolYear to enforce tenant scope. */
  findByIdAndSchool(
    id: string,
    schoolId: string,
  ): Promise<BehaviourFollowUp | null> {
    return this.createQueryBuilder('followUp')
      .innerJoin('followUp.behaviour', 'behaviour')
      .innerJoin('behaviour.schoolYear', 'schoolYear')
      .where('followUp.id = :id AND schoolYear.schoolId = :schoolId', {
        id,
        schoolId,
      })
      .getOne();
  }
}
