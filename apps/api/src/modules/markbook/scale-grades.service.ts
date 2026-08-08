import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isDuplicateEntryError } from '../../common/duplicate-entry-error';
import { ScaleGradesRepository } from './repositories/scale-grades.repository';
import { ScalesService } from './scales.service';
import { ScaleGrade } from './entities/scale-grade.entity';
import { CreateScaleGradeDto } from './dto/create-scale-grade.dto';
import { UpdateScaleGradeDto } from './dto/update-scale-grade.dto';

@Injectable()
export class ScaleGradesService {
  constructor(
    private readonly scaleGrades: ScaleGradesRepository,
    private readonly scales: ScalesService,
  ) {}

  async list(schoolId: string, scaleId: string): Promise<ScaleGrade[]> {
    await this.scales.getOwned(schoolId, scaleId);
    return this.scaleGrades.findByScale(scaleId);
  }

  async create(
    schoolId: string,
    scaleId: string,
    dto: CreateScaleGradeDto,
  ): Promise<ScaleGrade> {
    await this.scales.getOwned(schoolId, scaleId);

    try {
      return await this.scaleGrades.save(
        this.scaleGrades.create({
          scaleId,
          name: dto.name,
          shortName: dto.shortName,
          value: dto.value,
          sequenceNumber: dto.sequenceNumber ?? 0,
          lowestAcceptable: dto.lowestAcceptable ?? false,
        }),
      );
    } catch (error) {
      if (isDuplicateEntryError(error)) {
        throw new ConflictException(
          `A grade with short name "${dto.shortName}" already exists on this scale`,
        );
      }
      throw error;
    }
  }

  async update(
    schoolId: string,
    id: string,
    dto: UpdateScaleGradeDto,
  ): Promise<ScaleGrade> {
    const grade = await this.getOwned(schoolId, id);
    Object.assign(grade, dto);

    try {
      return await this.scaleGrades.save(grade);
    } catch (error) {
      if (isDuplicateEntryError(error)) {
        throw new ConflictException(
          `A grade with short name "${grade.shortName}" already exists on this scale`,
        );
      }
      throw error;
    }
  }

  async remove(schoolId: string, id: string): Promise<void> {
    const grade = await this.getOwned(schoolId, id);
    await this.scaleGrades.remove(grade);
  }

  async getOwned(schoolId: string, id: string): Promise<ScaleGrade> {
    const grade = await this.scaleGrades.findByIdAndSchool(id, schoolId);
    if (!grade) {
      throw new NotFoundException('Scale grade not found');
    }
    return grade;
  }
}
