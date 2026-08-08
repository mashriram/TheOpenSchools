import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { isDuplicateEntryError } from '../../common/duplicate-entry-error';
import { TimetablesRepository } from './repositories/timetables.repository';
import { TimetableYearGroupsRepository } from './repositories/timetable-year-groups.repository';
import { SchoolYearsRepository } from '../school/repositories/school-years.repository';
import { Timetable } from './entities/timetable.entity';
import { TimetableYearGroup } from './entities/timetable-year-group.entity';
import { CreateTimetableDto } from './dto/create-timetable.dto';
import { UpdateTimetableDto } from './dto/update-timetable.dto';

@Injectable()
export class TimetablesService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly timetables: TimetablesRepository,
    private readonly timetableYearGroups: TimetableYearGroupsRepository,
    private readonly schoolYears: SchoolYearsRepository,
  ) {}

  list(schoolId: string, schoolYearId?: string): Promise<Timetable[]> {
    return this.timetables.findBySchool(schoolId, schoolYearId);
  }

  async create(schoolId: string, dto: CreateTimetableDto): Promise<Timetable> {
    const schoolYear = await this.schoolYears.findOne({
      where: { id: dto.schoolYearId, schoolId },
    });
    if (!schoolYear) {
      throw new BadRequestException(
        'schoolYearId does not belong to this school',
      );
    }

    try {
      return await this.dataSource.transaction(async (manager) => {
        const timetablesRepo = manager.getRepository(Timetable);
        const yearGroupsRepo = manager.getRepository(TimetableYearGroup);

        const timetable = await timetablesRepo.save(
          timetablesRepo.create({
            schoolId,
            schoolYearId: dto.schoolYearId,
            name: dto.name,
            shortName: dto.shortName,
            active: dto.active ?? true,
          }),
        );

        if (dto.yearGroupIds && dto.yearGroupIds.length > 0) {
          await yearGroupsRepo.save(
            dto.yearGroupIds.map((yearGroupId) =>
              yearGroupsRepo.create({ timetableId: timetable.id, yearGroupId }),
            ),
          );
        }

        return timetable;
      });
    } catch (error) {
      if (isDuplicateEntryError(error)) {
        throw new ConflictException(
          `A timetable named "${dto.shortName}" already exists for this school year`,
        );
      }
      throw error;
    }
  }

  async update(
    schoolId: string,
    id: string,
    dto: UpdateTimetableDto,
  ): Promise<Timetable> {
    const timetable = await this.getOwned(schoolId, id);
    const { yearGroupIds, ...fields } = dto;
    Object.assign(timetable, fields);

    try {
      return await this.dataSource.transaction(async (manager) => {
        const timetablesRepo = manager.getRepository(Timetable);
        const yearGroupsRepo = manager.getRepository(TimetableYearGroup);

        const saved = await timetablesRepo.save(timetable);

        if (yearGroupIds !== undefined) {
          await yearGroupsRepo.delete({ timetableId: id });
          if (yearGroupIds.length > 0) {
            await yearGroupsRepo.save(
              yearGroupIds.map((yearGroupId) =>
                yearGroupsRepo.create({ timetableId: id, yearGroupId }),
              ),
            );
          }
        }

        return saved;
      });
    } catch (error) {
      if (isDuplicateEntryError(error)) {
        throw new ConflictException(
          `A timetable named "${timetable.shortName}" already exists for this school year`,
        );
      }
      throw error;
    }
  }

  async remove(schoolId: string, id: string): Promise<void> {
    const timetable = await this.getOwned(schoolId, id);
    await this.timetables.softRemove(timetable);
  }

  async getOwned(schoolId: string, id: string): Promise<Timetable> {
    const timetable = await this.timetables.findByIdAndSchool(id, schoolId);
    if (!timetable) {
      throw new NotFoundException('Timetable not found');
    }
    return timetable;
  }
}
