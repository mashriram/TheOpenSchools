import { Injectable, NotFoundException } from '@nestjs/common';
import { PeopleRepository } from './repositories/people.repository';
import { StaffRepository } from './repositories/staff.repository';
import { Staff } from './entities/staff.entity';
import { UpsertStaffDto } from './dto/upsert-staff.dto';

@Injectable()
export class StaffService {
  constructor(
    private readonly people: PeopleRepository,
    private readonly staff: StaffRepository,
  ) {}

  async get(schoolId: string, personId: string): Promise<Staff | null> {
    await this.assertPersonBelongsToSchool(schoolId, personId);
    return this.staff.findByPersonId(personId);
  }

  async upsert(
    schoolId: string,
    personId: string,
    dto: UpsertStaffDto,
  ): Promise<Staff> {
    await this.assertPersonBelongsToSchool(schoolId, personId);
    const existing = await this.staff.findByPersonId(personId);
    if (existing) {
      Object.assign(existing, dto);
      return this.staff.save(existing);
    }
    return this.staff.save(this.staff.create({ personId, ...dto }));
  }

  async remove(schoolId: string, personId: string): Promise<void> {
    await this.assertPersonBelongsToSchool(schoolId, personId);
    const existing = await this.staff.findByPersonId(personId);
    if (!existing) {
      throw new NotFoundException('Staff profile not found');
    }
    await this.staff.softRemove(existing);
  }

  private async assertPersonBelongsToSchool(
    schoolId: string,
    personId: string,
  ): Promise<void> {
    const person = await this.people.findOne({
      where: { id: personId, schoolId },
    });
    if (!person) {
      throw new NotFoundException('Person not found');
    }
  }
}
