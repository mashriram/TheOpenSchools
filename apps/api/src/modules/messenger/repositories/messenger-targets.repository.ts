import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { MessengerTarget } from '../entities/messenger-target.entity';

@Injectable()
export class MessengerTargetsRepository extends Repository<MessengerTarget> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(MessengerTarget, dataSource.createEntityManager());
  }

  findByMessenger(messengerId: string): Promise<MessengerTarget[]> {
    return this.find({ where: { messengerId } });
  }
}
