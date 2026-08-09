import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { MessengerCannedResponse } from '../entities/messenger-canned-response.entity';

@Injectable()
export class MessengerCannedResponsesRepository extends Repository<MessengerCannedResponse> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(MessengerCannedResponse, dataSource.createEntityManager());
  }

  findBySchool(schoolId: string): Promise<MessengerCannedResponse[]> {
    return this.find({ where: { schoolId }, order: { name: 'ASC' } });
  }

  findByIdAndSchool(
    id: string,
    schoolId: string,
  ): Promise<MessengerCannedResponse | null> {
    return this.findOne({ where: { id, schoolId } });
  }
}
