import { Injectable, NotFoundException } from '@nestjs/common';
import { MessengerReceiptsRepository } from './repositories/messenger-receipts.repository';
import { MessengerService } from './messenger.service';
import { MessengerReceipt } from './entities/messenger-receipt.entity';

@Injectable()
export class MessengerReceiptsService {
  constructor(
    private readonly receipts: MessengerReceiptsRepository,
    private readonly messenger: MessengerService,
  ) {}

  async list(
    schoolId: string,
    messengerId: string,
  ): Promise<MessengerReceipt[]> {
    await this.messenger.getOwned(schoolId, messengerId);
    return this.receipts.findByMessenger(messengerId);
  }

  /** A recipient confirming they've read a message (Gibbon's read-receipt tracking). */
  async confirm(
    schoolId: string,
    messengerId: string,
    personId: string,
  ): Promise<MessengerReceipt> {
    await this.messenger.getOwned(schoolId, messengerId);
    const receipt = await this.receipts.findByMessengerAndPerson(
      messengerId,
      personId,
    );
    if (!receipt) {
      throw new NotFoundException(
        'No receipt found for this person on this message',
      );
    }
    receipt.confirmed = true;
    receipt.confirmedTimestamp = new Date();
    return this.receipts.save(receipt);
  }
}
