import { Injectable, NotFoundException } from '@nestjs/common';
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
    return this.spaces.save(this.spaces.create({ schoolId, ...dto }));
  }

  async update(
    schoolId: string,
    id: string,
    dto: UpdateSpaceDto,
  ): Promise<Space> {
    const space = await this.getOwned(schoolId, id);
    Object.assign(space, dto);
    return this.spaces.save(space);
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
