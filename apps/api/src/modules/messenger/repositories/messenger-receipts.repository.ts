import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { MessengerReceipt } from '../entities/messenger-receipt.entity';

@Injectable()
export class MessengerReceiptsRepository extends Repository<MessengerReceipt> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(MessengerReceipt, dataSource.createEntityManager());
  }

  findByMessenger(messengerId: string): Promise<MessengerReceipt[]> {
    return this.find({ where: { messengerId } });
  }

  findByMessengerAndPerson(
    messengerId: string,
    personId: string,
  ): Promise<MessengerReceipt | null> {
    return this.findOne({ where: { messengerId, personId } });
  }
}
