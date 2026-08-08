import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isDuplicateEntryError } from '../../common/duplicate-entry-error';
import { ScalesRepository } from './repositories/scales.repository';
import { Scale } from './entities/scale.entity';
import { CreateScaleDto } from './dto/create-scale.dto';
import { UpdateScaleDto } from './dto/update-scale.dto';

@Injectable()
export class ScalesService {
  constructor(private readonly scales: ScalesRepository) {}

  list(schoolId: string): Promise<Scale[]> {
    return this.scales.findBySchool(schoolId);
  }

  async create(schoolId: string, dto: CreateScaleDto): Promise<Scale> {
    try {
      return await this.scales.save(
        this.scales.create({
          schoolId,
          name: dto.name,
          shortName: dto.shortName,
          description: dto.description ?? null,
          active: dto.active ?? true,
        }),
      );
    } catch (error) {
      if (isDuplicateEntryError(error)) {
        throw new ConflictException(
          `A scale with short name "${dto.shortName}" already exists for this school`,
        );
      }
      throw error;
    }
  }

  async update(
    schoolId: string,
    id: string,
    dto: UpdateScaleDto,
  ): Promise<Scale> {
    const scale = await this.getOwned(schoolId, id);
    Object.assign(scale, dto);

    try {
      return await this.scales.save(scale);
    } catch (error) {
      if (isDuplicateEntryError(error)) {
        throw new ConflictException(
          `A scale with short name "${scale.shortName}" already exists for this school`,
        );
      }
      throw error;
    }
  }

  async remove(schoolId: string, id: string): Promise<void> {
    const scale = await this.getOwned(schoolId, id);
    await this.scales.softRemove(scale);
  }

  /** Also used by ScaleGradesService/MarkbookColumnsService to authorize a Scale id. */
  async getOwned(schoolId: string, id: string): Promise<Scale> {
    const scale = await this.scales.findByIdAndSchool(id, schoolId);
    if (!scale) {
      throw new NotFoundException('Scale not found');
    }
    return scale;
  }
}
