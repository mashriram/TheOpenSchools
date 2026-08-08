import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PeopleModule } from '../people/people.module';
import { SchoolModule } from '../school/school.module';
import { CurriculumModule } from '../curriculum/curriculum.module';
import { RbacModule } from '../rbac/rbac.module';
import { IndividualNeed } from './entities/individual-need.entity';
import { IndividualNeedPersonDescriptor } from './entities/individual-need-person-descriptor.entity';
import { IndividualNeedInvestigation } from './entities/individual-need-investigation.entity';
import { IndividualNeedInvestigationContribution } from './entities/individual-need-investigation-contribution.entity';
import { IndividualNeedsRepository } from './repositories/individual-needs.repository';
import { IndividualNeedPersonDescriptorsRepository } from './repositories/individual-need-person-descriptors.repository';
import { IndividualNeedInvestigationsRepository } from './repositories/individual-need-investigations.repository';
import { IndividualNeedInvestigationContributionsRepository } from './repositories/individual-need-investigation-contributions.repository';
import { IndividualNeedsService } from './individual-needs.service';
import { IndividualNeedInvestigationsService } from './individual-need-investigations.service';
import { IndividualNeedInvestigationContributionsService } from './individual-need-investigation-contributions.service';
import {
  IndividualNeedDescriptorsController,
  IndividualNeedsController,
} from './individual-needs.controller';
import { IndividualNeedInvestigationsController } from './individual-need-investigations.controller';
import { IndividualNeedInvestigationContributionsController } from './individual-need-investigation-contributions.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      IndividualNeed,
      IndividualNeedPersonDescriptor,
      IndividualNeedInvestigation,
      IndividualNeedInvestigationContribution,
    ]),
    // For Person lookups (personId validation) and SchoolYear ownership
    // checks on investigations.
    PeopleModule,
    SchoolModule,
    // For CourseClassPeopleRepository (optional contribution -> enrolment
    // link validation).
    CurriculumModule,
    // For PoliciesGuard/CurrentAbility, used by every controller below.
    RbacModule,
  ],
  controllers: [
    IndividualNeedsController,
    IndividualNeedDescriptorsController,
    IndividualNeedInvestigationsController,
    IndividualNeedInvestigationContributionsController,
  ],
  providers: [
    IndividualNeedsRepository,
    IndividualNeedPersonDescriptorsRepository,
    IndividualNeedInvestigationsRepository,
    IndividualNeedInvestigationContributionsRepository,
    IndividualNeedsService,
    IndividualNeedInvestigationsService,
    IndividualNeedInvestigationContributionsService,
  ],
  exports: [
    IndividualNeedsRepository,
    IndividualNeedPersonDescriptorsRepository,
    IndividualNeedInvestigationsRepository,
    IndividualNeedInvestigationContributionsRepository,
  ],
})
export class IndividualNeedsModule {}
