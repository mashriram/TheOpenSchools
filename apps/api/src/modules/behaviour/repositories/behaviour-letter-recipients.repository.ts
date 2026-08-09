import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { BehaviourLetterRecipient } from '../entities/behaviour-letter-recipient.entity';

@Injectable()
export class BehaviourLetterRecipientsRepository extends Repository<BehaviourLetterRecipient> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(BehaviourLetterRecipient, dataSource.createEntityManager());
  }

  findBySnapshot(snapshotId: string): Promise<BehaviourLetterRecipient[]> {
    return this.find({ where: { snapshotId } });
  }
}
