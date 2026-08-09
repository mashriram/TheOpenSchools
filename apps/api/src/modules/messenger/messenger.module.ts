import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PeopleModule } from '../people/people.module';
import { SchoolModule } from '../school/school.module';
import { RbacModule } from '../rbac/rbac.module';
import { Messenger } from './entities/messenger.entity';
import { MessengerTarget } from './entities/messenger-target.entity';
import { MessengerReceipt } from './entities/messenger-receipt.entity';
import { MessengerMailingList } from './entities/messenger-mailing-list.entity';
import { MessengerMailingListRecipient } from './entities/messenger-mailing-list-recipient.entity';
import { MessengerCannedResponse } from './entities/messenger-canned-response.entity';
import { MessengersRepository } from './repositories/messengers.repository';
import { MessengerTargetsRepository } from './repositories/messenger-targets.repository';
import { MessengerReceiptsRepository } from './repositories/messenger-receipts.repository';
import { MessengerMailingListsRepository } from './repositories/messenger-mailing-lists.repository';
import { MessengerMailingListRecipientsRepository } from './repositories/messenger-mailing-list-recipients.repository';
import { MessengerCannedResponsesRepository } from './repositories/messenger-canned-responses.repository';
import { MessengerService } from './messenger.service';
import { MessengerReceiptsService } from './messenger-receipts.service';
import { MessengerRetentionService } from './messenger-retention.service';
import { MessengerMailingListsService } from './messenger-mailing-lists.service';
import { MessengerCannedResponsesService } from './messenger-canned-responses.service';
import { MessengerController } from './messenger.controller';
import { MessengerMailingListsController } from './messenger-mailing-lists.controller';
import { MessengerCannedResponsesController } from './messenger-canned-responses.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Messenger,
      MessengerTarget,
      MessengerReceipt,
      MessengerMailingList,
      MessengerMailingListRecipient,
      MessengerCannedResponse,
    ]),
    // For Person/StudentEnrolment/PersonRole lookups (audience resolution)
    // and Role/FormGroup/YearGroup/House/Setting lookups (target ownership
    // checks and the retention-window setting).
    PeopleModule,
    SchoolModule,
    RbacModule,
  ],
  controllers: [
    MessengerController,
    MessengerMailingListsController,
    MessengerCannedResponsesController,
  ],
  providers: [
    MessengersRepository,
    MessengerTargetsRepository,
    MessengerReceiptsRepository,
    MessengerMailingListsRepository,
    MessengerMailingListRecipientsRepository,
    MessengerCannedResponsesRepository,
    MessengerService,
    MessengerReceiptsService,
    MessengerRetentionService,
    MessengerMailingListsService,
    MessengerCannedResponsesService,
  ],
  exports: [
    MessengersRepository,
    MessengerTargetsRepository,
    MessengerReceiptsRepository,
  ],
})
export class MessengerModule {}
