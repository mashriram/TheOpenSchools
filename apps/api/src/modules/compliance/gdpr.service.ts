import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { PeopleRepository } from '../people/repositories/people.repository';
import { PersonCredentialsRepository } from '../people/repositories/person-credentials.repository';
import { PersonPhonesRepository } from '../people/repositories/person-phones.repository';
import { PersonEmergencyContactsRepository } from '../people/repositories/person-emergency-contacts.repository';
import { PersonOAuthConnectionsRepository } from '../people/repositories/person-oauth-connections.repository';
import { PersonRolesRepository } from '../people/repositories/person-roles.repository';
import { StaffRepository } from '../people/repositories/staff.repository';
import { StudentEnrolmentsRepository } from '../people/repositories/student-enrolments.repository';
import { FamilyAdultsRepository } from '../people/repositories/family-adults.repository';
import { FamilyChildrenRepository } from '../people/repositories/family-children.repository';
import { AttendanceLogPerson } from '../attendance/entities/attendance-log-person.entity';
import { Behaviour } from '../behaviour/entities/behaviour.entity';
import { BehaviourLetterSnapshot } from '../behaviour/entities/behaviour-letter-snapshot.entity';
import { BehaviourLetterRecipient } from '../behaviour/entities/behaviour-letter-recipient.entity';
import { MessengerReceipt } from '../messenger/entities/messenger-receipt.entity';
import { Person } from '../people/entities/person.entity';
import { PersonCredential } from '../people/entities/person-credential.entity';
import { PersonPhone } from '../people/entities/person-phone.entity';
import { PersonEmergencyContact } from '../people/entities/person-emergency-contact.entity';
import { PersonOAuthConnection } from '../people/entities/person-oauth-connection.entity';
import { HashingService } from '../auth/hashing.service';
import { AuditService } from './audit.service';
import { ConsentRecordsRepository } from './repositories/consent-records.repository';
import { ConsentRecord } from './entities/consent-record.entity';
import {
  buildAttendanceLogPersonErasureFields,
  buildBehaviourErasureFields,
  buildBehaviourLetterRecipientErasureFields,
  buildBehaviourLetterSnapshotErasureFields,
  buildErasureFields,
  buildMessengerReceiptErasureFields,
} from './build-erasure-fields';

@Injectable()
export class GdprService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly people: PeopleRepository,
    private readonly personCredentials: PersonCredentialsRepository,
    private readonly phones: PersonPhonesRepository,
    private readonly emergencyContacts: PersonEmergencyContactsRepository,
    private readonly oauthConnections: PersonOAuthConnectionsRepository,
    private readonly personRoles: PersonRolesRepository,
    private readonly staff: StaffRepository,
    private readonly studentEnrolments: StudentEnrolmentsRepository,
    private readonly familyAdults: FamilyAdultsRepository,
    private readonly familyChildren: FamilyChildrenRepository,
    private readonly consentRecords: ConsentRecordsRepository,
    private readonly hashing: HashingService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * The right to access/export (Art. 15) - aggregates a person's data
   * across every Foundation entity. Gibbon has no equivalent at all.
   * Secrets (passwordHash, mfaSecret, oauth refreshToken) are never
   * included, even in an export to the data subject themselves.
   */
  async exportPerson(schoolId: string, personId: string) {
    const person = await this.getOwned(schoolId, personId);

    const [
      credential,
      phoneRows,
      emergencyContactRows,
      oauthRows,
      roles,
      staffProfile,
      enrolments,
      adultOf,
      childOf,
      consents,
    ] = await Promise.all([
      this.personCredentials.findByPersonId(personId),
      this.phones.findByPerson(personId),
      this.emergencyContacts.findByPerson(personId),
      this.oauthConnections.find({ where: { personId } }),
      this.personRoles.findByPerson(personId),
      this.staff.findByPersonId(personId),
      this.studentEnrolments.findByPerson(personId),
      this.familyAdults.find({
        where: { personId },
        relations: { family: true },
      }),
      this.familyChildren.find({
        where: { personId },
        relations: { family: true },
      }),
      this.consentRecords.findByPerson(personId),
    ]);

    await this.auditService.record(this.dataSource.manager, {
      action: 'export',
      entityName: 'Person',
      entityId: personId,
      before: null,
      after: null,
    });

    return {
      person,
      credential: credential
        ? {
            username: credential.username,
            canLogin: credential.canLogin,
            mfaEnabled: credential.mfaEnabled,
            lastLoginAt: credential.lastLoginAt,
            emailVerifiedAt: credential.emailVerifiedAt,
          }
        : null,
      phones: phoneRows,
      emergencyContacts: emergencyContactRows,
      oauthConnections: oauthRows.map((c) => ({ provider: c.provider })),
      roles,
      staff: staffProfile,
      enrolments,
      familyAdultOf: adultOf,
      familyChildOf: childOf,
      consents,
    };
  }

  /**
   * The right to erasure (Art. 17) - the automatic, self-service-triggerable
   * fix for Gibbon's manual-admin-only ScrubbableGateway. Nulls the
   * Person's own PII columns and deletes pure-PII child rows (phones,
   * emergency contacts, oauth connections); StudentEnrolment/PersonRole/
   * FamilyAdult/FamilyChild rows are deliberately left alone - they're
   * statutorily-required structural records, not PII by themselves.
   */
  async requestErasure(schoolId: string, personId: string): Promise<void> {
    const person = await this.getOwned(schoolId, personId);

    await this.dataSource.transaction(async (manager) => {
      const peopleRepo = manager.getRepository(Person);
      Object.assign(person, buildErasureFields());
      person.erasedAt = new Date();
      await peopleRepo.save(person);

      const credential = await this.personCredentials.findByPersonId(personId);
      if (credential) {
        credential.canLogin = false;
        credential.mfaSecret = null;
        // Not deleted (the row still ties history together via personId) -
        // just made permanently unusable.
        credential.passwordHash = await this.hashing.hashPassword(randomUUID());
        await manager.getRepository(PersonCredential).save(credential);
      }

      await manager.getRepository(PersonPhone).delete({ personId });
      await manager.getRepository(PersonEmergencyContact).delete({ personId });
      await manager.getRepository(PersonOAuthConnection).delete({ personId });

      // Tier 2, M17: Gibbon has zero retention/erasure coverage for
      // attendance records at all - this closes that gap directly rather
      // than leaving it for a later milestone. Nulls the Tier B free-text
      // fields only; the structural attendance fact is kept (see
      // buildAttendanceLogPersonErasureFields' doc comment).
      await manager
        .getRepository(AttendanceLogPerson)
        .update({ personId }, buildAttendanceLogPersonErasureFields());

      // Tier 2, M20: three independent write paths, mirroring
      // BehaviourLetterSnapshot's doc comment - the source Behaviour
      // record's narrative, the letter snapshot's body (when this person
      // is the subject student), and this person's own recipient row on
      // any letter (when they were a parent who received one) all get
      // scrubbed independently. Fixes Gibbon's real gap where the letter
      // recipientList is silently exempted from any erasure path.
      await manager
        .getRepository(Behaviour)
        .update({ personId }, buildBehaviourErasureFields());
      await manager
        .getRepository(BehaviourLetterSnapshot)
        .update({ personId }, buildBehaviourLetterSnapshotErasureFields());
      await manager
        .getRepository(BehaviourLetterRecipient)
        .update({ personId }, buildBehaviourLetterRecipientErasureFields());

      // Tier 2, M23: this recipient's send-time name snapshot only - see
      // buildMessengerReceiptErasureFields' doc comment for why message
      // content itself is a separate, time-based retention mechanism
      // rather than personId-keyed erasure.
      await manager
        .getRepository(MessengerReceipt)
        .update({ personId }, buildMessengerReceiptErasureFields());

      await this.auditService.record(manager, {
        action: 'erase',
        entityName: 'Person',
        entityId: personId,
        before: null,
        after: { erasedAt: person.erasedAt },
      });
    });
  }

  async recordConsent(
    personId: string,
    policyVersion: string,
  ): Promise<ConsentRecord> {
    return this.consentRecords.save(
      this.consentRecords.create({
        personId,
        policyVersion,
        acceptedAt: new Date(),
      }),
    );
  }

  private async getOwned(schoolId: string, personId: string): Promise<Person> {
    const person = await this.people.findOne({
      where: { id: personId, schoolId },
    });
    if (!person) {
      throw new NotFoundException('Person not found');
    }
    return person;
  }
}
