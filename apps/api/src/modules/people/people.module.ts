import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Person } from './entities/person.entity';
import { PersonCredential } from './entities/person-credential.entity';
import { PersonPhone } from './entities/person-phone.entity';
import { PersonEmergencyContact } from './entities/person-emergency-contact.entity';
import { PersonOAuthConnection } from './entities/person-oauth-connection.entity';
import { PersonRole } from './entities/person-role.entity';
import { PeopleRepository } from './repositories/people.repository';
import { PersonCredentialsRepository } from './repositories/person-credentials.repository';
import { PersonPhonesRepository } from './repositories/person-phones.repository';
import { PersonEmergencyContactsRepository } from './repositories/person-emergency-contacts.repository';
import { PersonOAuthConnectionsRepository } from './repositories/person-oauth-connections.repository';
import { PersonRolesRepository } from './repositories/person-roles.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Person,
      PersonCredential,
      PersonPhone,
      PersonEmergencyContact,
      PersonOAuthConnection,
      PersonRole,
    ]),
  ],
  providers: [
    PeopleRepository,
    PersonCredentialsRepository,
    PersonPhonesRepository,
    PersonEmergencyContactsRepository,
    PersonOAuthConnectionsRepository,
    PersonRolesRepository,
  ],
  exports: [
    PeopleRepository,
    PersonCredentialsRepository,
    PersonPhonesRepository,
    PersonEmergencyContactsRepository,
    PersonOAuthConnectionsRepository,
    PersonRolesRepository,
  ],
})
export class PeopleModule {}
