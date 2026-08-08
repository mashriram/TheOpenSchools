import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isDuplicateEntryError } from '../../common/duplicate-entry-error';
import { YearGroupsRepository } from './repositories/year-groups.repository';
import { YearGroup } from './entities/year-group.entity';
import { CreateYearGroupDto } from './dto/create-year-group.dto';
import { UpdateYearGroupDto } from './dto/update-year-group.dto';
import { PeopleRepository } from '../people/repositories/people.repository';

@Injectable()
export class YearGroupsService {
  constructor(
    private readonly yearGroups: YearGroupsRepository,
    private readonly people: PeopleRepository,
  ) {}

  list(schoolId: string): Promise<YearGroup[]> {
    return this.yearGroups.findBySchool(schoolId);
  }

  async create(schoolId: string, dto: CreateYearGroupDto): Promise<YearGroup> {
    await this.assertHeadOfYearBelongsToSchool(
      schoolId,
      dto.headOfYearPersonId,
    );
    try {
      return await this.yearGroups.save(
        this.yearGroups.create({
          schoolId,
          name: dto.name,
          shortName: dto.shortName,
          sequenceNumber: dto.sequenceNumber,
          headOfYearPersonId: dto.headOfYearPersonId ?? null,
        }),
      );
    } catch (error) {
      if (isDuplicateEntryError(error)) {
        throw new ConflictException(
          `A year group named "${dto.name}" already exists at this school`,
        );
      }
      throw error;
    }
  }

  async update(
    schoolId: string,
    id: string,
    dto: UpdateYearGroupDto,
  ): Promise<YearGroup> {
    const yearGroup = await this.getOwned(schoolId, id);
    await this.assertHeadOfYearBelongsToSchool(
      schoolId,
      dto.headOfYearPersonId,
    );
    Object.assign(yearGroup, dto);
    try {
      return await this.yearGroups.save(yearGroup);
    } catch (error) {
      if (isDuplicateEntryError(error)) {
        throw new ConflictException(
          `A year group named "${yearGroup.name}" already exists at this school`,
        );
      }
      throw error;
    }
  }

  async remove(schoolId: string, id: string): Promise<void> {
    const yearGroup = await this.getOwned(schoolId, id);
    await this.yearGroups.softRemove(yearGroup);
  }

  private async getOwned(schoolId: string, id: string): Promise<YearGroup> {
    const yearGroup = await this.yearGroups.findOne({
      where: { id, schoolId },
    });
    if (!yearGroup) {
      throw new NotFoundException('Year group not found');
    }
    return yearGroup;
  }

  /**
   * Without this check, a school admin could point headOfYearPersonId at a
   * Person belonging to a different tenant - a real cross-tenant reference,
   * not just a bad-data problem.
   */
  private async assertHeadOfYearBelongsToSchool(
    schoolId: string,
    personId: string | undefined,
  ): Promise<void> {
    if (!personId) {
      return;
    }
    const person = await this.people.findOne({
      where: { id: personId, schoolId },
    });
    if (!person) {
      throw new BadRequestException(
        'headOfYearPersonId does not belong to this school',
      );
    }
  }
}
