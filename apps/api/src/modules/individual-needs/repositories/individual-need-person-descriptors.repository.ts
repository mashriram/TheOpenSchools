import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { IndividualNeedPersonDescriptor } from '../entities/individual-need-person-descriptor.entity';

@Injectable()
export class IndividualNeedPersonDescriptorsRepository extends Repository<IndividualNeedPersonDescriptor> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(IndividualNeedPersonDescriptor, dataSource.createEntityManager());
  }

  findByPerson(personId: string): Promise<IndividualNeedPersonDescriptor[]> {
    return this.find({ where: { personId } });
  }

  /** Joins IndividualNeedPersonDescriptor -> Person to enforce tenant scope. */
  findByIdAndSchool(
    id: string,
    schoolId: string,
  ): Promise<IndividualNeedPersonDescriptor | null> {
    return this.createQueryBuilder('descriptor')
      .innerJoin('descriptor.person', 'person')
      .where('descriptor.id = :id AND person.schoolId = :schoolId', {
        id,
        schoolId,
      })
      .getOne();
  }
}
