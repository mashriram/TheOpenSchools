import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MarkbookColumnsRepository } from './repositories/markbook-columns.repository';
import { ScalesRepository } from './repositories/scales.repository';
import { CourseClassesService } from '../curriculum/course-classes.service';
import { MarkbookColumn } from './entities/markbook-column.entity';
import { CreateMarkbookColumnDto } from './dto/create-markbook-column.dto';
import { UpdateMarkbookColumnDto } from './dto/update-markbook-column.dto';

@Injectable()
export class MarkbookColumnsService {
  constructor(
    private readonly columns: MarkbookColumnsRepository,
    private readonly scales: ScalesRepository,
    private readonly courseClasses: CourseClassesService,
  ) {}

  async list(
    schoolId: string,
    courseClassId: string,
  ): Promise<MarkbookColumn[]> {
    await this.courseClasses.getOwned(schoolId, courseClassId);
    return this.columns.findByCourseClass(courseClassId);
  }

  async create(
    schoolId: string,
    courseClassId: string,
    dto: CreateMarkbookColumnDto,
  ): Promise<MarkbookColumn> {
    await this.courseClasses.getOwned(schoolId, courseClassId);
    await this.assertScaleBelongsToSchool(schoolId, dto.scaleIdAttainment);
    await this.assertScaleBelongsToSchool(schoolId, dto.scaleIdEffort);

    return this.columns.save(
      this.columns.create({
        courseClassId,
        name: dto.name,
        description: dto.description ?? null,
        sequenceNumber: dto.sequenceNumber ?? 0,
        attainmentEnabled: dto.attainmentEnabled ?? true,
        effortEnabled: dto.effortEnabled ?? true,
        scaleIdAttainment: dto.scaleIdAttainment ?? null,
        scaleIdEffort: dto.scaleIdEffort ?? null,
        viewableStudents: dto.viewableStudents ?? false,
        viewableParents: dto.viewableParents ?? false,
        complete: dto.complete ?? false,
        completeDate: dto.completeDate ?? null,
      }),
    );
  }

  async update(
    schoolId: string,
    id: string,
    dto: UpdateMarkbookColumnDto,
  ): Promise<MarkbookColumn> {
    const column = await this.getOwned(schoolId, id);
    await this.assertScaleBelongsToSchool(schoolId, dto.scaleIdAttainment);
    await this.assertScaleBelongsToSchool(schoolId, dto.scaleIdEffort);
    Object.assign(column, dto);
    return this.columns.save(column);
  }

  async remove(schoolId: string, id: string): Promise<void> {
    const column = await this.getOwned(schoolId, id);
    await this.columns.softRemove(column);
  }

  /** Also used by MarkbookEntriesService to authorize a MarkbookColumn id. */
  async getOwned(schoolId: string, id: string): Promise<MarkbookColumn> {
    const column = await this.columns.findByIdAndSchool(id, schoolId);
    if (!column) {
      throw new NotFoundException('Markbook column not found');
    }
    return column;
  }

  private async assertScaleBelongsToSchool(
    schoolId: string,
    scaleId: string | undefined,
  ): Promise<void> {
    if (!scaleId) {
      return;
    }
    const scale = await this.scales.findByIdAndSchool(scaleId, schoolId);
    if (!scale) {
      throw new BadRequestException('scaleId does not belong to this school');
    }
  }
}
