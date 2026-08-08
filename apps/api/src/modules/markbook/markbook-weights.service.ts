import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isDuplicateEntryError } from '../../common/duplicate-entry-error';
import { MarkbookWeightsRepository } from './repositories/markbook-weights.repository';
import { CourseClassesService } from '../curriculum/course-classes.service';
import { MarkbookWeight } from './entities/markbook-weight.entity';
import { CreateMarkbookWeightDto } from './dto/create-markbook-weight.dto';
import { UpdateMarkbookWeightDto } from './dto/update-markbook-weight.dto';

/**
 * Schema-modeled per the plan; the weighted-average report computation that
 * would actually consume these rows is a documented deferral (report
 * generation is out of Tier 2 MVP scope) - see MarkbookWeight's doc comment.
 */
@Injectable()
export class MarkbookWeightsService {
  constructor(
    private readonly weights: MarkbookWeightsRepository,
    private readonly courseClasses: CourseClassesService,
  ) {}

  async list(
    schoolId: string,
    courseClassId: string,
  ): Promise<MarkbookWeight[]> {
    await this.courseClasses.getOwned(schoolId, courseClassId);
    return this.weights.findByCourseClass(courseClassId);
  }

  async create(
    schoolId: string,
    courseClassId: string,
    dto: CreateMarkbookWeightDto,
  ): Promise<MarkbookWeight> {
    await this.courseClasses.getOwned(schoolId, courseClassId);

    try {
      return await this.weights.save(
        this.weights.create({
          courseClassId,
          name: dto.name,
          weighting: dto.weighting,
          sequenceNumber: dto.sequenceNumber ?? 0,
        }),
      );
    } catch (error) {
      if (isDuplicateEntryError(error)) {
        throw new ConflictException(
          `A weighting named "${dto.name}" already exists for this class`,
        );
      }
      throw error;
    }
  }

  async update(
    schoolId: string,
    id: string,
    dto: UpdateMarkbookWeightDto,
  ): Promise<MarkbookWeight> {
    const weight = await this.getOwned(schoolId, id);
    Object.assign(weight, dto);

    try {
      return await this.weights.save(weight);
    } catch (error) {
      if (isDuplicateEntryError(error)) {
        throw new ConflictException(
          `A weighting named "${weight.name}" already exists for this class`,
        );
      }
      throw error;
    }
  }

  async remove(schoolId: string, id: string): Promise<void> {
    const weight = await this.getOwned(schoolId, id);
    await this.weights.remove(weight);
  }

  async getOwned(schoolId: string, id: string): Promise<MarkbookWeight> {
    const weight = await this.weights.findByIdAndSchool(id, schoolId);
    if (!weight) {
      throw new NotFoundException('Markbook weight not found');
    }
    return weight;
  }
}
