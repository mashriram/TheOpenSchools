import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isDuplicateEntryError } from '../../common/duplicate-entry-error';
import { SpacesRepository } from './repositories/spaces.repository';
import { Space } from './entities/space.entity';
import { CreateSpaceDto } from './dto/create-space.dto';
import { UpdateSpaceDto } from './dto/update-space.dto';

@Injectable()
export class SpacesService {
  constructor(private readonly spaces: SpacesRepository) {}

  list(schoolId: string): Promise<Space[]> {
    return this.spaces.findBySchool(schoolId);
  }

  async create(schoolId: string, dto: CreateSpaceDto): Promise<Space> {
    try {
      return await this.spaces.save(this.spaces.create({ schoolId, ...dto }));
    } catch (error) {
      if (isDuplicateEntryError(error)) {
        throw new ConflictException(
          `A space named "${dto.name}" already exists at this school`,
        );
      }
      throw error;
    }
  }

  async update(
    schoolId: string,
    id: string,
    dto: UpdateSpaceDto,
  ): Promise<Space> {
    const space = await this.getOwned(schoolId, id);
    Object.assign(space, dto);
    try {
      return await this.spaces.save(space);
    } catch (error) {
      if (isDuplicateEntryError(error)) {
        throw new ConflictException(
          `A space named "${space.name}" already exists at this school`,
        );
      }
      throw error;
    }
  }

  async remove(schoolId: string, id: string): Promise<void> {
    const space = await this.getOwned(schoolId, id);
    await this.spaces.softRemove(space);
  }

  private async getOwned(schoolId: string, id: string): Promise<Space> {
    const space = await this.spaces.findOne({ where: { id, schoolId } });
    if (!space) {
      throw new NotFoundException('Space not found');
    }
    return space;
  }
}
