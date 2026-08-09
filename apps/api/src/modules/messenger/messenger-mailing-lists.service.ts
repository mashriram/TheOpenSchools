import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isDuplicateEntryError } from '../../common/duplicate-entry-error';
import { MessengerMailingListsRepository } from './repositories/messenger-mailing-lists.repository';
import { MessengerMailingListRecipientsRepository } from './repositories/messenger-mailing-list-recipients.repository';
import { PeopleRepository } from '../people/repositories/people.repository';
import { MessengerMailingList } from './entities/messenger-mailing-list.entity';
import { MessengerMailingListRecipient } from './entities/messenger-mailing-list-recipient.entity';
import { CreateMailingListDto } from './dto/create-mailing-list.dto';
import { UpdateMailingListDto } from './dto/update-mailing-list.dto';

@Injectable()
export class MessengerMailingListsService {
  constructor(
    private readonly mailingLists: MessengerMailingListsRepository,
    private readonly recipients: MessengerMailingListRecipientsRepository,
    private readonly people: PeopleRepository,
  ) {}

  list(schoolId: string): Promise<MessengerMailingList[]> {
    return this.mailingLists.findBySchool(schoolId);
  }

  async create(
    schoolId: string,
    dto: CreateMailingListDto,
  ): Promise<MessengerMailingList> {
    try {
      return await this.mailingLists.save(
        this.mailingLists.create({ schoolId, ...dto }),
      );
    } catch (error) {
      if (isDuplicateEntryError(error)) {
        throw new ConflictException(
          `A mailing list named "${dto.name}" already exists for this school`,
        );
      }
      throw error;
    }
  }

  async update(
    schoolId: string,
    id: string,
    dto: UpdateMailingListDto,
  ): Promise<MessengerMailingList> {
    const mailingList = await this.getOwned(schoolId, id);
    Object.assign(mailingList, dto);

    try {
      return await this.mailingLists.save(mailingList);
    } catch (error) {
      if (isDuplicateEntryError(error)) {
        throw new ConflictException(
          `A mailing list named "${mailingList.name}" already exists for this school`,
        );
      }
      throw error;
    }
  }

  async remove(schoolId: string, id: string): Promise<void> {
    const mailingList = await this.getOwned(schoolId, id);
    await this.mailingLists.softRemove(mailingList);
  }

  /** Also used by MessengerService to authorize a MailingList target id. */
  async getOwned(schoolId: string, id: string): Promise<MessengerMailingList> {
    const mailingList = await this.mailingLists.findByIdAndSchool(id, schoolId);
    if (!mailingList) {
      throw new NotFoundException('Mailing list not found');
    }
    return mailingList;
  }

  async listRecipients(
    schoolId: string,
    mailingListId: string,
  ): Promise<MessengerMailingListRecipient[]> {
    await this.getOwned(schoolId, mailingListId);
    return this.recipients.findByMailingList(mailingListId);
  }

  async addRecipient(
    schoolId: string,
    mailingListId: string,
    personId: string,
  ): Promise<MessengerMailingListRecipient> {
    await this.getOwned(schoolId, mailingListId);
    const person = await this.people.findOne({
      where: { id: personId, schoolId },
    });
    if (!person) {
      throw new BadRequestException('personId does not belong to this school');
    }

    try {
      return await this.recipients.save(
        this.recipients.create({ mailingListId, personId }),
      );
    } catch (error) {
      if (isDuplicateEntryError(error)) {
        throw new ConflictException(
          'This person is already on the mailing list',
        );
      }
      throw error;
    }
  }

  async removeRecipient(schoolId: string, id: string): Promise<void> {
    const recipient = await this.recipients.findOne({ where: { id } });
    if (!recipient) {
      throw new NotFoundException('Recipient not found');
    }
    // Confirms tenant ownership via the mailing list, then removes.
    await this.getOwned(schoolId, recipient.mailingListId);
    await this.recipients.remove(recipient);
  }
}
