import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { In } from 'typeorm';
import { BehaviourLetterSnapshotsRepository } from './repositories/behaviour-letter-snapshots.repository';
import { BehaviourLetterRecipientsRepository } from './repositories/behaviour-letter-recipients.repository';
import { BehavioursRepository } from './repositories/behaviours.repository';
import { SchoolYearsRepository } from '../school/repositories/school-years.repository';
import { PeopleRepository } from '../people/repositories/people.repository';
import { FamilyAdultsRepository } from '../people/repositories/family-adults.repository';
import { FamilyChildrenRepository } from '../people/repositories/family-children.repository';
import { BehaviourLetterSnapshot } from './entities/behaviour-letter-snapshot.entity';
import { CreateLetterSnapshotDto } from './dto/create-letter-snapshot.dto';

/**
 * See BehaviourLetterSnapshot's doc comment for the full design rationale:
 * an immutable, Tier-C-encrypted snapshot captured at send time, with
 * per-recipient rows rather than an opaque blob, so a single recipient's
 * GDPR erasure is a normal indexed update (see GdprService.requestErasure).
 */
@Injectable()
export class BehaviourLettersService {
  constructor(
    private readonly snapshots: BehaviourLetterSnapshotsRepository,
    private readonly recipients: BehaviourLetterRecipientsRepository,
    private readonly behaviours: BehavioursRepository,
    private readonly schoolYears: SchoolYearsRepository,
    private readonly people: PeopleRepository,
    private readonly familyAdults: FamilyAdultsRepository,
    private readonly familyChildren: FamilyChildrenRepository,
  ) {}

  async listForPerson(
    schoolId: string,
    personId: string,
  ): Promise<BehaviourLetterSnapshot[]> {
    const person = await this.people.findOne({
      where: { id: personId, schoolId },
    });
    if (!person) {
      throw new BadRequestException('personId does not belong to this school');
    }
    return this.snapshots.findByPerson(personId);
  }

  async getOwned(
    schoolId: string,
    id: string,
  ): Promise<BehaviourLetterSnapshot> {
    const snapshot = await this.snapshots.findByIdAndSchool(id, schoolId);
    if (!snapshot) {
      throw new NotFoundException('Behaviour letter not found');
    }
    return snapshot;
  }

  async create(
    schoolId: string,
    dto: CreateLetterSnapshotDto,
  ): Promise<BehaviourLetterSnapshot> {
    const schoolYear = await this.schoolYears.findOne({
      where: { id: dto.schoolYearId, schoolId },
    });
    if (!schoolYear) {
      throw new BadRequestException(
        'schoolYearId does not belong to this school',
      );
    }
    const person = await this.people.findOne({
      where: { id: dto.personId, schoolId },
    });
    if (!person) {
      throw new BadRequestException('personId does not belong to this school');
    }

    const recordCountAtCreation = await this.behaviours.countByPersonAndType(
      dto.personId,
      dto.type,
    );
    const snapshot = await this.snapshots.save(
      this.snapshots.create({
        schoolYearId: dto.schoolYearId,
        personId: dto.personId,
        letterLevel: dto.letterLevel,
        status: dto.status,
        type: dto.type,
        recordCountAtCreation,
        body: dto.body,
        sentAt: new Date(),
      }),
    );

    const recipientAdults = await this.resolveRecipients(dto.personId);
    if (recipientAdults.length > 0) {
      await this.recipients.save(
        recipientAdults.map((adult) =>
          this.recipients.create({
            snapshotId: snapshot.id,
            personId: adult.id,
            name: `${adult.firstName} ${adult.surname}`,
            email: adult.email,
          }),
        ),
      );
    }

    return snapshot;
  }

  listRecipients(snapshotId: string) {
    return this.recipients.findBySnapshot(snapshotId);
  }

  /** The student's family adults with childDataAccess - the real recipients of a behaviour letter. */
  private async resolveRecipients(studentPersonId: string) {
    const familyLinks = await this.familyChildren.find({
      where: { personId: studentPersonId },
    });
    if (familyLinks.length === 0) {
      return [];
    }
    const familyIds = familyLinks.map((link) => link.familyId);
    const adults = await this.familyAdults.find({
      where: { familyId: In(familyIds), childDataAccess: true },
      relations: { person: true },
    });
    return adults.map((adult) => adult.person);
  }
}
