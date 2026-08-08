import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SchoolModule } from '../school/school.module';
import { RbacModule } from '../rbac/rbac.module';
import { Person } from './entities/person.entity';
import { PersonCredential } from './entities/person-credential.entity';
import { PersonPhone } from './entities/person-phone.entity';
import { PersonEmergencyContact } from './entities/person-emergency-contact.entity';
import { PersonOAuthConnection } from './entities/person-oauth-connection.entity';
import { PersonRole } from './entities/person-role.entity';
import { Staff } from './entities/staff.entity';
import { StudentEnrolment } from './entities/student-enrolment.entity';
import { Family } from './entities/family.entity';
import { FamilyAdult } from './entities/family-adult.entity';
import { FamilyChild } from './entities/family-child.entity';
import { PeopleRepository } from './repositories/people.repository';
import { PersonCredentialsRepository } from './repositories/person-credentials.repository';
import { PersonPhonesRepository } from './repositories/person-phones.repository';
import { PersonEmergencyContactsRepository } from './repositories/person-emergency-contacts.repository';
import { PersonOAuthConnectionsRepository } from './repositories/person-oauth-connections.repository';
import { PersonRolesRepository } from './repositories/person-roles.repository';
import { StaffRepository } from './repositories/staff.repository';
import { StudentEnrolmentsRepository } from './repositories/student-enrolments.repository';
import { FamiliesRepository } from './repositories/families.repository';
import { FamilyAdultsRepository } from './repositories/family-adults.repository';
import { FamilyChildrenRepository } from './repositories/family-children.repository';
import { PeopleService } from './people.service';
import { StaffService } from './staff.service';
import { StudentEnrolmentsService } from './student-enrolments.service';
import { FamiliesService } from './families.service';
import { PeopleController } from './people.controller';
import { FamiliesController } from './families.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Person,
      PersonCredential,
      PersonPhone,
      PersonEmergencyContact,
      PersonOAuthConnection,
      PersonRole,
      Staff,
      StudentEnrolment,
      Family,
      FamilyAdult,
      FamilyChild,
    ]),
    // PeopleService/StudentEnrolmentsService validate that a given
    // schoolYearId/yearGroupId/formGroupId/houseId belongs to the caller's
    // school - see SchoolModule's matching forwardRef() for why this is a
    // genuine mutual dependency, not an accident.
    forwardRef(() => SchoolModule),
    // For PoliciesGuard, used by every controller below via @UseGuards().
    RbacModule,
  ],
  controllers: [PeopleController, FamiliesController],
  providers: [
    PeopleRepository,
    PersonCredentialsRepository,
    PersonPhonesRepository,
    PersonEmergencyContactsRepository,
    PersonOAuthConnectionsRepository,
    PersonRolesRepository,
    StaffRepository,
    StudentEnrolmentsRepository,
    FamiliesRepository,
    FamilyAdultsRepository,
    FamilyChildrenRepository,
    PeopleService,
    StaffService,
    StudentEnrolmentsService,
    FamiliesService,
  ],
  exports: [
    PeopleRepository,
    PersonCredentialsRepository,
    PersonPhonesRepository,
    PersonEmergencyContactsRepository,
    PersonOAuthConnectionsRepository,
    PersonRolesRepository,
    StaffRepository,
    StudentEnrolmentsRepository,
    FamiliesRepository,
    FamilyAdultsRepository,
    FamilyChildrenRepository,
  ],
})
export class PeopleModule {}
