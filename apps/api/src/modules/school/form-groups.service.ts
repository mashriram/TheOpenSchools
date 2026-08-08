import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FormGroupsRepository } from './repositories/form-groups.repository';
import { SchoolYearsRepository } from './repositories/school-years.repository';
import { SpacesRepository } from './repositories/spaces.repository';
import { FormGroup } from './entities/form-group.entity';
import { CreateFormGroupDto } from './dto/create-form-group.dto';
import { UpdateFormGroupDto } from './dto/update-form-group.dto';

@Injectable()
export class FormGroupsService {
  constructor(
    private readonly formGroups: FormGroupsRepository,
    private readonly schoolYears: SchoolYearsRepository,
    private readonly spaces: SpacesRepository,
  ) {}

  async listBySchoolYear(
    schoolId: string,
    schoolYearId: string,
  ): Promise<FormGroup[]> {
    await this.assertSchoolYearBelongsToSchool(schoolId, schoolYearId);
    return this.formGroups.findBySchoolYear(schoolYearId);
  }

  async create(schoolId: string, dto: CreateFormGroupDto): Promise<FormGroup> {
    await this.assertSchoolYearBelongsToSchool(schoolId, dto.schoolYearId);
    await this.assertSpaceBelongsToSchool(schoolId, dto.spaceId);
    await this.assertNextFormGroupInSameSchoolYear(
      dto.schoolYearId,
      dto.nextFormGroupId,
    );

    return this.formGroups.save(
      this.formGroups.create({
        schoolYearId: dto.schoolYearId,
        name: dto.name,
        shortName: dto.shortName,
        spaceId: dto.spaceId ?? null,
        nextFormGroupId: dto.nextFormGroupId ?? null,
        attendance: dto.attendance ?? true,
        website: dto.website ?? null,
      }),
    );
  }

  async update(
    schoolId: string,
    id: string,
    dto: UpdateFormGroupDto,
  ): Promise<FormGroup> {
    const formGroup = await this.getOwned(schoolId, id);
    await this.assertSpaceBelongsToSchool(schoolId, dto.spaceId);
    if (dto.nextFormGroupId !== undefined) {
      await this.assertNextFormGroupInSameSchoolYear(
        formGroup.schoolYearId,
        dto.nextFormGroupId,
      );
    }
    Object.assign(formGroup, dto);
    return this.formGroups.save(formGroup);
  }

  async remove(schoolId: string, id: string): Promise<void> {
    const formGroup = await this.getOwned(schoolId, id);
    await this.formGroups.softRemove(formGroup);
  }

  /** Also used by FormGroupStaffService to authorize the staff sub-resource. */
  async getOwned(schoolId: string, id: string): Promise<FormGroup> {
    const formGroup = await this.formGroups.findByIdWithSchoolYear(id);
    if (!formGroup || formGroup.schoolYear.schoolId !== schoolId) {
      throw new NotFoundException('Form group not found');
    }
    return formGroup;
  }

  private async assertSchoolYearBelongsToSchool(
    schoolId: string,
    schoolYearId: string,
  ): Promise<void> {
    const schoolYear = await this.schoolYears.findOne({
      where: { id: schoolYearId, schoolId },
    });
    if (!schoolYear) {
      throw new BadRequestException(
        'schoolYearId does not belong to this school',
      );
    }
  }

  private async assertSpaceBelongsToSchool(
    schoolId: string,
    spaceId: string | undefined,
  ): Promise<void> {
    if (!spaceId) {
      return;
    }
    const space = await this.spaces.findOne({
      where: { id: spaceId, schoolId },
    });
    if (!space) {
      throw new BadRequestException('spaceId does not belong to this school');
    }
  }

  private async assertNextFormGroupInSameSchoolYear(
    schoolYearId: string,
    nextFormGroupId: string | undefined,
  ): Promise<void> {
    if (!nextFormGroupId) {
      return;
    }
    const next = await this.formGroups.findOne({
      where: { id: nextFormGroupId, schoolYearId },
    });
    if (!next) {
      throw new BadRequestException(
        'nextFormGroupId does not belong to the same school year',
      );
    }
  }
}
