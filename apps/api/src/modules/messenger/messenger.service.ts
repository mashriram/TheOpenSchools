import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { In } from 'typeorm';
import { MessengersRepository } from './repositories/messengers.repository';
import { MessengerTargetsRepository } from './repositories/messenger-targets.repository';
import { MessengerReceiptsRepository } from './repositories/messenger-receipts.repository';
import { MessengerMailingListRecipientsRepository } from './repositories/messenger-mailing-list-recipients.repository';
import { RolesRepository } from '../rbac/repositories/roles.repository';
import { PersonRolesRepository } from '../people/repositories/person-roles.repository';
import { FormGroupsRepository } from '../school/repositories/form-groups.repository';
import { YearGroupsRepository } from '../school/repositories/year-groups.repository';
import { HousesRepository } from '../school/repositories/houses.repository';
import { PeopleRepository } from '../people/repositories/people.repository';
import { StudentEnrolmentsRepository } from '../people/repositories/student-enrolments.repository';
import { MessengerMailingListsService } from './messenger-mailing-lists.service';
import { Messenger } from './entities/messenger.entity';
import { MessengerTargetType } from './entities/messenger-target.entity';
import { CreateMessengerDto } from './dto/create-messenger.dto';
import { MessengerTargetDto } from './dto/messenger-target.dto';

interface ResolvedRecipient {
  personId: string;
  name: string;
}

const TARGET_FK_FIELD: Record<MessengerTargetType, string> = {
  Role: 'roleId',
  FormGroup: 'formGroupId',
  YearGroup: 'yearGroupId',
  House: 'houseId',
  Person: 'personId',
  MailingList: 'mailingListId',
};

@Injectable()
export class MessengerService {
  constructor(
    private readonly messengers: MessengersRepository,
    private readonly targets: MessengerTargetsRepository,
    private readonly receipts: MessengerReceiptsRepository,
    private readonly mailingListRecipients: MessengerMailingListRecipientsRepository,
    private readonly mailingLists: MessengerMailingListsService,
    private readonly roles: RolesRepository,
    private readonly personRoles: PersonRolesRepository,
    private readonly formGroups: FormGroupsRepository,
    private readonly yearGroups: YearGroupsRepository,
    private readonly houses: HousesRepository,
    private readonly people: PeopleRepository,
    private readonly studentEnrolments: StudentEnrolmentsRepository,
  ) {}

  list(schoolId: string): Promise<Messenger[]> {
    return this.messengers.findBySchool(schoolId);
  }

  async getOwned(schoolId: string, id: string): Promise<Messenger> {
    const message = await this.messengers.findByIdAndSchool(id, schoolId);
    if (!message) {
      throw new NotFoundException('Message not found');
    }
    return message;
  }

  /**
   * Resolves the audience at send time (a fixed snapshot, matching
   * Gibbon's real design) and creates the Messenger row plus its
   * MessengerTarget/MessengerReceipt rows in one go.
   */
  async create(
    schoolId: string,
    senderPersonId: string | null,
    dto: CreateMessengerDto,
  ): Promise<Messenger> {
    const recipients = await this.resolveRecipients(
      schoolId,
      dto.schoolYearId,
      dto.targets,
    );

    const message = await this.messengers.save(
      this.messengers.create({
        schoolId,
        senderPersonId,
        subject: dto.subject,
        body: dto.body,
        method: dto.method ?? 'MessageWall',
        confidential: dto.confidential ?? false,
      }),
    );

    await this.targets.save(
      dto.targets.map((target) =>
        this.targets.create({
          messengerId: message.id,
          targetType: target.targetType,
          [TARGET_FK_FIELD[target.targetType]]: target.targetId,
        }),
      ),
    );

    if (recipients.length > 0) {
      await this.receipts.save(
        recipients.map((recipient) =>
          this.receipts.create({
            messengerId: message.id,
            personId: recipient.personId,
            recipientName: recipient.name,
          }),
        ),
      );
    }

    return message;
  }

  async remove(schoolId: string, id: string): Promise<void> {
    const message = await this.getOwned(schoolId, id);
    // MessengerTarget/MessengerReceipt cascade via a real FK - the direct
    // fix for Gibbon's confirmed orphan-row bug (see those entities' doc
    // comments).
    await this.messengers.remove(message);
  }

  private async resolveRecipients(
    schoolId: string,
    schoolYearId: string,
    targetDtos: MessengerTargetDto[],
  ): Promise<ResolvedRecipient[]> {
    const personIds = new Set<string>();

    for (const target of targetDtos) {
      const ids = await this.resolveTargetPersonIds(
        schoolId,
        schoolYearId,
        target,
      );
      ids.forEach((id) => personIds.add(id));
    }

    if (personIds.size === 0) {
      return [];
    }

    const people = await this.people.find({
      where: { id: In([...personIds]), schoolId },
    });
    return people.map((person) => ({
      personId: person.id,
      name: `${person.firstName} ${person.surname}`,
    }));
  }

  private async resolveTargetPersonIds(
    schoolId: string,
    schoolYearId: string,
    target: MessengerTargetDto,
  ): Promise<string[]> {
    switch (target.targetType) {
      case 'Person': {
        const person = await this.people.findOne({
          where: { id: target.targetId, schoolId },
        });
        if (!person) {
          throw new BadRequestException(
            'A Person target does not belong to this school',
          );
        }
        return [person.id];
      }
      case 'Role': {
        const role = await this.roles.findOne({
          where: { id: target.targetId, schoolId },
        });
        if (!role) {
          throw new BadRequestException(
            'A Role target does not belong to this school',
          );
        }
        const rows = await this.personRoles.findByRole(role.id);
        return rows.map((row) => row.personId);
      }
      case 'FormGroup': {
        const formGroup = await this.formGroups.findByIdWithSchoolYear(
          target.targetId,
        );
        if (!formGroup || formGroup.schoolYear.schoolId !== schoolId) {
          throw new BadRequestException(
            'A FormGroup target does not belong to this school',
          );
        }
        const rows = await this.studentEnrolments.findByFormGroup(formGroup.id);
        return rows.map((row) => row.personId);
      }
      case 'YearGroup': {
        const yearGroup = await this.yearGroups.findOne({
          where: { id: target.targetId, schoolId },
        });
        if (!yearGroup) {
          throw new BadRequestException(
            'A YearGroup target does not belong to this school',
          );
        }
        const rows = await this.studentEnrolments.findByYearGroupAndSchoolYear(
          yearGroup.id,
          schoolYearId,
        );
        return rows.map((row) => row.personId);
      }
      case 'House': {
        const house = await this.houses.findOne({
          where: { id: target.targetId, schoolId },
        });
        if (!house) {
          throw new BadRequestException(
            'A House target does not belong to this school',
          );
        }
        const rows = await this.people.find({
          where: { schoolId, houseId: house.id },
        });
        return rows.map((row) => row.id);
      }
      case 'MailingList': {
        const mailingList = await this.mailingLists.getOwned(
          schoolId,
          target.targetId,
        );
        const rows = await this.mailingListRecipients.findByMailingList(
          mailingList.id,
        );
        return rows.map((row) => row.personId);
      }
    }
  }
}
