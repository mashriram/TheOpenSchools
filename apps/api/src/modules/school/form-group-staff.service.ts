import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isDuplicateEntryError } from '../../common/duplicate-entry-error';
import { FormGroupStaffRepository } from './repositories/form-group-staff.repository';
import { FormGroupsService } from './form-groups.service';
import { FormGroupStaff } from './entities/form-group-staff.entity';
import { AddFormGroupStaffDto } from './dto/add-form-group-staff.dto';
import { PeopleRepository } from '../people/repositories/people.repository';

@Injectable()
export class FormGroupStaffService {
  constructor(
    private readonly formGroupStaff: FormGroupStaffRepository,
    private readonly formGroups: FormGroupsService,
    private readonly people: PeopleRepository,
  ) {}

  async list(schoolId: string, formGroupId: string): Promise<FormGroupStaff[]> {
    await this.formGroups.getOwned(schoolId, formGroupId);
    return this.formGroupStaff.findByFormGroup(formGroupId);
  }

  async add(
    schoolId: string,
    formGroupId: string,
    dto: AddFormGroupStaffDto,
  ): Promise<FormGroupStaff> {
    await this.formGroups.getOwned(schoolId, formGroupId);
    const person = await this.people.findOne({
      where: { id: dto.personId, schoolId },
    });
    if (!person) {
      throw new BadRequestException('personId does not belong to this school');
    }

    try {
      return await this.formGroupStaff.save(
        this.formGroupStaff.create({
          formGroupId,
          personId: dto.personId,
          role: dto.role,
          priority: dto.priority ?? 0,
        }),
      );
    } catch (error) {
      if (isDuplicateEntryError(error)) {
        throw new ConflictException(
          'That person is already assigned to this form group',
        );
      }
      throw error;
    }
  }

  async remove(
    schoolId: string,
    formGroupId: string,
    staffId: string,
  ): Promise<void> {
    await this.formGroups.getOwned(schoolId, formGroupId);
    const staff = await this.formGroupStaff.findOne({
      where: { id: staffId, formGroupId },
    });
    if (!staff) {
      throw new NotFoundException('Form group staff assignment not found');
    }
    await this.formGroupStaff.remove(staff);
  }
}
