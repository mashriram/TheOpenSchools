import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { MessengerMailingListRecipient } from '../entities/messenger-mailing-list-recipient.entity';

@Injectable()
export class MessengerMailingListRecipientsRepository extends Repository<MessengerMailingListRecipient> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(MessengerMailingListRecipient, dataSource.createEntityManager());
  }

  findByMailingList(
    mailingListId: string,
  ): Promise<MessengerMailingListRecipient[]> {
    return this.find({ where: { mailingListId } });
  }
}
