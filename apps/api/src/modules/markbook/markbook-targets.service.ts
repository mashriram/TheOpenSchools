import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isDuplicateEntryError } from '../../common/duplicate-entry-error';
import { MarkbookTargetsRepository } from './repositories/markbook-targets.repository';
import { ScaleGradesRepository } from './repositories/scale-grades.repository';
import { CourseClassesService } from '../curriculum/course-classes.service';
import { PeopleRepository } from '../people/repositories/people.repository';
import { MarkbookTarget } from './entities/markbook-target.entity';
import { CreateMarkbookTargetDto } from './dto/create-markbook-target.dto';
import { UpdateMarkbookTargetDto } from './dto/update-markbook-target.dto';

@Injectable()
export class MarkbookTargetsService {
  constructor(
    private readonly targets: MarkbookTargetsRepository,
    private readonly scaleGrades: ScaleGradesRepository,
    private readonly courseClasses: CourseClassesService,
    private readonly people: PeopleRepository,
  ) {}

  async list(
    schoolId: string,
    courseClassId: string,
  ): Promise<MarkbookTarget[]> {
    await this.courseClasses.getOwned(schoolId, courseClassId);
    return this.targets.findByCourseClass(courseClassId);
  }

  async create(
    schoolId: string,
    courseClassId: string,
    dto: CreateMarkbookTargetDto,
  ): Promise<MarkbookTarget> {
    await this.courseClasses.getOwned(schoolId, courseClassId);
    await this.assertPersonBelongsToSchool(schoolId, dto.personId);
    await this.assertGradeBelongsToSchool(schoolId, dto.targetScaleGradeId);

    try {
      return await this.targets.save(
        this.targets.create({
          courseClassId,
          personId: dto.personId,
          targetScaleGradeId: dto.targetScaleGradeId,
        }),
      );
    } catch (error) {
      if (isDuplicateEntryError(error)) {
        throw new ConflictException(
          'This person already has a personal target for this class',
        );
      }
      throw error;
    }
  }

  async update(
    schoolId: string,
    id: string,
    dto: UpdateMarkbookTargetDto,
  ): Promise<MarkbookTarget> {
    const target = await this.getOwned(schoolId, id);
    await this.assertGradeBelongsToSchool(schoolId, dto.targetScaleGradeId);
    target.targetScaleGradeId = dto.targetScaleGradeId;
    return this.targets.save(target);
  }

  async remove(schoolId: string, id: string): Promise<void> {
    const target = await this.getOwned(schoolId, id);
    await this.targets.remove(target);
  }

  async getOwned(schoolId: string, id: string): Promise<MarkbookTarget> {
    const target = await this.targets.findByIdAndSchool(id, schoolId);
    if (!target) {
      throw new NotFoundException('Markbook target not found');
    }
    return target;
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

  private async assertGradeBelongsToSchool(
    schoolId: string,
    scaleGradeId: string | undefined,
  ): Promise<void> {
    if (!scaleGradeId) {
      return;
    }
    const grade = await this.scaleGrades.findByIdAndSchool(
      scaleGradeId,
      schoolId,
    );
    if (!grade) {
      throw new BadRequestException(
        'targetScaleGradeId does not belong to this school',
      );
    }
  }
}
