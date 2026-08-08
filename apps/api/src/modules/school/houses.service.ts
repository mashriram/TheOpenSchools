import { Injectable, NotFoundException } from '@nestjs/common';
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
    return this.houses.save(
      this.houses.create({
        schoolId,
        name: dto.name,
        shortName: dto.shortName,
        logoUrl: dto.logoUrl ?? null,
      }),
    );
  }

  async update(
    schoolId: string,
    id: string,
    dto: UpdateHouseDto,
  ): Promise<House> {
    const house = await this.getOwned(schoolId, id);
    Object.assign(house, dto);
    return this.houses.save(house);
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
