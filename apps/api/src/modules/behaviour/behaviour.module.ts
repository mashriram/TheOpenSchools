import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PeopleModule } from '../people/people.module';
import { SchoolModule } from '../school/school.module';
import { RbacModule } from '../rbac/rbac.module';
import { Behaviour } from './entities/behaviour.entity';
import { BehaviourFollowUp } from './entities/behaviour-follow-up.entity';
import { BehaviourLetterSnapshot } from './entities/behaviour-letter-snapshot.entity';
import { BehaviourLetterRecipient } from './entities/behaviour-letter-recipient.entity';
import { BehavioursRepository } from './repositories/behaviours.repository';
import { BehaviourFollowUpsRepository } from './repositories/behaviour-follow-ups.repository';
import { BehaviourLetterSnapshotsRepository } from './repositories/behaviour-letter-snapshots.repository';
import { BehaviourLetterRecipientsRepository } from './repositories/behaviour-letter-recipients.repository';
import { BehaviourService } from './behaviour.service';
import { BehaviourFollowUpsService } from './behaviour-follow-ups.service';
import { BehaviourLettersService } from './behaviour-letters.service';
import { BehaviourController } from './behaviour.controller';
import { BehaviourFollowUpsController } from './behaviour-follow-ups.controller';
import { BehaviourLettersController } from './behaviour-letters.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Behaviour,
      BehaviourFollowUp,
      BehaviourLetterSnapshot,
      BehaviourLetterRecipient,
    ]),
    // For Person/SchoolYear/Role/FamilyAdult/FamilyChild lookups (person
    // ownership checks, the self/child viewer-classification gate, and
    // letter-recipient resolution).
    PeopleModule,
    SchoolModule,
    // For PoliciesGuard, used by every controller below via @UseGuards().
    RbacModule,
  ],
  controllers: [
    BehaviourController,
    BehaviourFollowUpsController,
    BehaviourLettersController,
  ],
  providers: [
    BehavioursRepository,
    BehaviourFollowUpsRepository,
    BehaviourLetterSnapshotsRepository,
    BehaviourLetterRecipientsRepository,
    BehaviourService,
    BehaviourFollowUpsService,
    BehaviourLettersService,
  ],
  exports: [
    BehavioursRepository,
    BehaviourFollowUpsRepository,
    BehaviourLetterSnapshotsRepository,
    BehaviourLetterRecipientsRepository,
  ],
})
export class BehaviourModule {}
