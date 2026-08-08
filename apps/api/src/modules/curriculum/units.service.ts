import { Injectable, NotFoundException } from '@nestjs/common';
import { UnitsRepository } from './repositories/units.repository';
import { CoursesService } from './courses.service';
import { Unit } from './entities/unit.entity';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';

@Injectable()
export class UnitsService {
  constructor(
    private readonly units: UnitsRepository,
    private readonly courses: CoursesService,
  ) {}

  async list(schoolId: string, courseId: string): Promise<Unit[]> {
    await this.courses.getOwned(schoolId, courseId);
    return this.units.findByCourse(courseId);
  }

  async create(
    schoolId: string,
    courseId: string,
    dto: CreateUnitDto,
  ): Promise<Unit> {
    await this.courses.getOwned(schoolId, courseId);

    return this.units.save(
      this.units.create({
        courseId,
        name: dto.name,
        active: dto.active ?? true,
        description: dto.description ?? null,
        sequenceNumber: dto.sequenceNumber ?? 0,
      }),
    );
  }

  async update(
    schoolId: string,
    id: string,
    dto: UpdateUnitDto,
  ): Promise<Unit> {
    const unit = await this.getOwned(schoolId, id);
    Object.assign(unit, dto);
    return this.units.save(unit);
  }

  async remove(schoolId: string, id: string): Promise<void> {
    const unit = await this.getOwned(schoolId, id);
    await this.units.softRemove(unit);
  }

  private async getOwned(schoolId: string, id: string): Promise<Unit> {
    const unit = await this.units.findByIdAndSchool(id, schoolId);
    if (!unit) {
      throw new NotFoundException('Unit not found');
    }
    return unit;
  }
}
