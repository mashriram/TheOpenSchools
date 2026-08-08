import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isDuplicateEntryError } from '../../common/duplicate-entry-error';
import { TimetableDayRowClassesRepository } from './repositories/timetable-day-row-classes.repository';
import { TimetableColumnRowsRepository } from './repositories/timetable-column-rows.repository';
import { TimetableDaysRepository } from './repositories/timetable-days.repository';
import { CourseClassesRepository } from '../curriculum/repositories/course-classes.repository';
import { SpacesRepository } from '../school/repositories/spaces.repository';
import { TimetableDayRowClass } from './entities/timetable-day-row-class.entity';
import { ScheduleClassDto } from './dto/schedule-class.dto';
import { UpdateScheduledClassSpaceDto } from './dto/update-scheduled-class-space.dto';

@Injectable()
export class TimetableSchedulingService {
  constructor(
    private readonly dayRowClasses: TimetableDayRowClassesRepository,
    private readonly columnRows: TimetableColumnRowsRepository,
    private readonly days: TimetableDaysRepository,
    private readonly courseClasses: CourseClassesRepository,
    private readonly spaces: SpacesRepository,
  ) {}

  async scheduleClass(
    schoolId: string,
    dto: ScheduleClassDto,
  ): Promise<TimetableDayRowClass> {
    const [columnRow, day, courseClass] = await Promise.all([
      this.columnRows.findByIdAndSchool(dto.timetableColumnRowId, schoolId),
      this.days.findByIdAndSchool(dto.timetableDayId, schoolId),
      this.courseClasses.findByIdAndSchool(dto.courseClassId, schoolId),
    ]);
    if (!columnRow) {
      throw new BadRequestException(
        'timetableColumnRowId does not belong to this school',
      );
    }
    if (!day) {
      throw new BadRequestException(
        'timetableDayId does not belong to this school',
      );
    }
    if (!courseClass) {
      throw new BadRequestException(
        'courseClassId does not belong to this school',
      );
    }
    if (dto.spaceId) {
      const space = await this.spaces.findOne({
        where: { id: dto.spaceId, schoolId },
      });
      if (!space) {
        throw new BadRequestException('spaceId does not belong to this school');
      }
    }

    try {
      return await this.dayRowClasses.save(
        this.dayRowClasses.create({
          timetableColumnRowId: dto.timetableColumnRowId,
          timetableDayId: dto.timetableDayId,
          courseClassId: dto.courseClassId,
          spaceId: dto.spaceId ?? null,
        }),
      );
    } catch (error) {
      if (isDuplicateEntryError(error)) {
        throw new ConflictException(
          'This class is already scheduled into that day and period',
        );
      }
      throw error;
    }
  }

  async updateSpace(
    schoolId: string,
    id: string,
    dto: UpdateScheduledClassSpaceDto,
  ): Promise<TimetableDayRowClass> {
    const scheduled = await this.getOwned(schoolId, id);
    if (dto.spaceId) {
      const space = await this.spaces.findOne({
        where: { id: dto.spaceId, schoolId },
      });
      if (!space) {
        throw new BadRequestException('spaceId does not belong to this school');
      }
    }
    scheduled.spaceId = dto.spaceId ?? null;
    return this.dayRowClasses.save(scheduled);
  }

  async unscheduleClass(schoolId: string, id: string): Promise<void> {
    const scheduled = await this.getOwned(schoolId, id);
    await this.dayRowClasses.remove(scheduled);
  }

  private async getOwned(
    schoolId: string,
    id: string,
  ): Promise<TimetableDayRowClass> {
    const scheduled = await this.dayRowClasses.findByIdAndSchool(id, schoolId);
    if (!scheduled) {
      throw new NotFoundException('Scheduled class not found');
    }
    return scheduled;
  }
}
