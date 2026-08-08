import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isDuplicateEntryError } from '../../common/duplicate-entry-error';
import { FamiliesRepository } from './repositories/families.repository';
import { FamilyAdultsRepository } from './repositories/family-adults.repository';
import { FamilyChildrenRepository } from './repositories/family-children.repository';
import { PeopleRepository } from './repositories/people.repository';
import { Family } from './entities/family.entity';
import { FamilyAdult } from './entities/family-adult.entity';
import { FamilyChild } from './entities/family-child.entity';
import { CreateFamilyDto } from './dto/create-family.dto';
import { UpdateFamilyDto } from './dto/update-family.dto';
import { AddFamilyAdultDto } from './dto/add-family-adult.dto';
import { AddFamilyChildDto } from './dto/add-family-child.dto';

export interface FamilyProfile extends Family {
  adults: FamilyAdult[];
  children: FamilyChild[];
}

@Injectable()
export class FamiliesService {
  constructor(
    private readonly families: FamiliesRepository,
    private readonly familyAdults: FamilyAdultsRepository,
    private readonly familyChildren: FamilyChildrenRepository,
    private readonly people: PeopleRepository,
  ) {}

  list(schoolId: string): Promise<Family[]> {
    return this.families.findBySchool(schoolId);
  }

  create(schoolId: string, dto: CreateFamilyDto): Promise<Family> {
    return this.families.save(this.families.create({ schoolId, ...dto }));
  }

  async getProfile(schoolId: string, id: string): Promise<FamilyProfile> {
    const family = await this.getOwned(schoolId, id);
    const [adults, children] = await Promise.all([
      this.familyAdults.findByFamily(id),
      this.familyChildren.findByFamily(id),
    ]);
    return { ...family, adults, children };
  }

  async update(
    schoolId: string,
    id: string,
    dto: UpdateFamilyDto,
  ): Promise<Family> {
    const family = await this.getOwned(schoolId, id);
    Object.assign(family, dto);
    return this.families.save(family);
  }

  async remove(schoolId: string, id: string): Promise<void> {
    const family = await this.getOwned(schoolId, id);
    await this.families.softRemove(family);
  }

  async addAdult(
    schoolId: string,
    familyId: string,
    dto: AddFamilyAdultDto,
  ): Promise<FamilyAdult> {
    await this.getOwned(schoolId, familyId);
    await this.assertPersonBelongsToSchool(schoolId, dto.personId);

    try {
      return await this.familyAdults.save(
        this.familyAdults.create({ familyId, ...dto }),
      );
    } catch (error) {
      if (isDuplicateEntryError(error)) {
        throw new ConflictException(
          'That person is already an adult on this family',
        );
      }
      throw error;
    }
  }

  async removeAdult(
    schoolId: string,
    familyId: string,
    adultId: string,
  ): Promise<void> {
    await this.getOwned(schoolId, familyId);
    const adult = await this.familyAdults.findOne({
      where: { id: adultId, familyId },
    });
    if (!adult) {
      throw new NotFoundException('Family adult not found');
    }
    await this.familyAdults.remove(adult);
  }

  async addChild(
    schoolId: string,
    familyId: string,
    dto: AddFamilyChildDto,
  ): Promise<FamilyChild> {
    await this.getOwned(schoolId, familyId);
    await this.assertPersonBelongsToSchool(schoolId, dto.personId);

    try {
      return await this.familyChildren.save(
        this.familyChildren.create({ familyId, ...dto }),
      );
    } catch (error) {
      if (isDuplicateEntryError(error)) {
        throw new ConflictException(
          'That person is already a child on this family',
        );
      }
      throw error;
    }
  }

  async removeChild(
    schoolId: string,
    familyId: string,
    childId: string,
  ): Promise<void> {
    await this.getOwned(schoolId, familyId);
    const child = await this.familyChildren.findOne({
      where: { id: childId, familyId },
    });
    if (!child) {
      throw new NotFoundException('Family child not found');
    }
    await this.familyChildren.remove(child);
  }

  private async getOwned(schoolId: string, id: string): Promise<Family> {
    const family = await this.families.findOne({ where: { id, schoolId } });
    if (!family) {
      throw new NotFoundException('Family not found');
    }
    return family;
  }

  private async assertPersonBelongsToSchool(
    schoolId: string,
    personId: string,
  ): Promise<void> {
    const person = await this.people.findOne({
      where: { id: personId, schoolId },
    });
    if (!person) {
      throw new BadRequestException('personId does not belong to this school');
    }
  }
}
