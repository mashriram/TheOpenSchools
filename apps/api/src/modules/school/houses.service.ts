import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isDuplicateEntryError } from '../../common/duplicate-entry-error';
import { HousesRepository } from './repositories/houses.repository';
import { House } from './entities/house.entity';
import { CreateHouseDto } from './dto/create-house.dto';
import { UpdateHouseDto } from './dto/update-house.dto';

@Injectable()
export class HousesService {
  constructor(private readonly houses: HousesRepository) {}

  list(schoolId: string): Promise<House[]> {
    return this.houses.findBySchool(schoolId);
  }

  async create(schoolId: string, dto: CreateHouseDto): Promise<House> {
    try {
      return await this.houses.save(
        this.houses.create({
          schoolId,
          name: dto.name,
          shortName: dto.shortName,
          logoUrl: dto.logoUrl ?? null,
        }),
      );
    } catch (error) {
      if (isDuplicateEntryError(error)) {
        throw new ConflictException(
          `A house named "${dto.name}" already exists at this school`,
        );
      }
      throw error;
    }
  }

  async update(
    schoolId: string,
    id: string,
    dto: UpdateHouseDto,
  ): Promise<House> {
    const house = await this.getOwned(schoolId, id);
    Object.assign(house, dto);
    try {
      return await this.houses.save(house);
    } catch (error) {
      if (isDuplicateEntryError(error)) {
        throw new ConflictException(
          `A house named "${house.name}" already exists at this school`,
        );
      }
      throw error;
    }
  }

  async remove(schoolId: string, id: string): Promise<void> {
    const house = await this.getOwned(schoolId, id);
    await this.houses.softRemove(house);
  }

  private async getOwned(schoolId: string, id: string): Promise<House> {
    const house = await this.houses.findOne({ where: { id, schoolId } });
    if (!house) {
      throw new NotFoundException('House not found');
    }
    return house;
  }
}
