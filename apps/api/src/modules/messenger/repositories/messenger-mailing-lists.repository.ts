import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { MessengerMailingList } from '../entities/messenger-mailing-list.entity';

@Injectable()
export class MessengerMailingListsRepository extends Repository<MessengerMailingList> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(MessengerMailingList, dataSource.createEntityManager());
  }

  findBySchool(schoolId: string): Promise<MessengerMailingList[]> {
    return this.find({ where: { schoolId }, order: { name: 'ASC' } });
  }

  findByIdAndSchool(
    id: string,
    schoolId: string,
  ): Promise<MessengerMailingList | null> {
    return this.findOne({ where: { id, schoolId } });
  }
}
