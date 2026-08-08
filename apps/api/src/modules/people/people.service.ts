import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PeopleRepository } from './repositories/people.repository';
import { PersonRolesRepository } from './repositories/person-roles.repository';
import { PersonPhonesRepository } from './repositories/person-phones.repository';
import { PersonEmergencyContactsRepository } from './repositories/person-emergency-contacts.repository';
import { StaffRepository } from './repositories/staff.repository';
import { StudentEnrolmentsRepository } from './repositories/student-enrolments.repository';
import { HousesRepository } from '../school/repositories/houses.repository';
import { Person } from './entities/person.entity';
import { PersonRole } from './entities/person-role.entity';
import { PersonPhone } from './entities/person-phone.entity';
import { PersonEmergencyContact } from './entities/person-emergency-contact.entity';
import { Staff } from './entities/staff.entity';
import { StudentEnrolment } from './entities/student-enrolment.entity';
import { CreatePersonDto } from './dto/create-person.dto';
import { UpdatePersonDto } from './dto/update-person.dto';

export interface PersonProfile extends Person {
  roles: PersonRole[];
  phones: PersonPhone[];
  emergencyContacts: PersonEmergencyContact[];
  staff: Staff | null;
  enrolments: StudentEnrolment[];
}

@Injectable()
export class PeopleService {
  constructor(
    private readonly people: PeopleRepository,
    private readonly personRoles: PersonRolesRepository,
    private readonly phones: PersonPhonesRepository,
    private readonly emergencyContacts: PersonEmergencyContactsRepository,
    private readonly staff: StaffRepository,
    private readonly studentEnrolments: StudentEnrolmentsRepository,
    private readonly houses: HousesRepository,
  ) {}

  list(
    schoolId: string,
    filters: { role?: string; formGroupId?: string },
  ): Promise<Person[]> {
    if (!filters.role && !filters.formGroupId) {
      return this.people.findBySchool(schoolId);
    }
    return this.people.findBySchoolWithFilters(schoolId, {
      roleName: filters.role,
      formGroupId: filters.formGroupId,
    });
  }

  async create(schoolId: string, dto: CreatePersonDto): Promise<Person> {
    await this.assertHouseBelongsToSchool(schoolId, dto.houseId);
    return this.people.save(
      this.people.create({
        schoolId,
        surname: dto.surname,
        firstName: dto.firstName,
        preferredName: dto.preferredName ?? null,
        title: dto.title ?? null,
        gender: dto.gender,
        dateOfBirth: dto.dateOfBirth ?? null,
        email: dto.email ?? null,
        emailAlternate: dto.emailAlternate ?? null,
        status: dto.status,
        houseId: dto.houseId ?? null,
        studentIdNumber: dto.studentIdNumber ?? null,
      }),
    );
  }

  async getProfile(schoolId: string, id: string): Promise<PersonProfile> {
    const person = await this.getOwned(schoolId, id);
    const [roles, phones, emergencyContacts, staffProfile, enrolments] =
      await Promise.all([
        this.personRoles.findByPerson(id),
        this.phones.findByPerson(id),
        this.emergencyContacts.findByPerson(id),
        this.staff.findByPersonId(id),
        this.studentEnrolments.findByPerson(id),
      ]);
    return {
      ...person,
      roles,
      phones,
      emergencyContacts,
      staff: staffProfile,
      enrolments,
    };
  }

  async update(
    schoolId: string,
    id: string,
    dto: UpdatePersonDto,
  ): Promise<Person> {
    const person = await this.getOwned(schoolId, id);
    await this.assertHouseBelongsToSchool(schoolId, dto.houseId);
    Object.assign(person, dto);
    return this.people.save(person);
  }

  async remove(schoolId: string, id: string): Promise<void> {
    const person = await this.getOwned(schoolId, id);
    await this.people.softRemove(person);
  }

  async getOwned(schoolId: string, id: string): Promise<Person> {
    const person = await this.people.findOne({ where: { id, schoolId } });
    if (!person) {
      throw new NotFoundException('Person not found');
    }
    return person;
  }

  private async assertHouseBelongsToSchool(
    schoolId: string,
    houseId: string | undefined,
  ): Promise<void> {
    if (!houseId) {
      return;
    }
    const house = await this.houses.findOne({
      where: { id: houseId, schoolId },
    });
    if (!house) {
      throw new BadRequestException('houseId does not belong to this school');
    }
  }
}
