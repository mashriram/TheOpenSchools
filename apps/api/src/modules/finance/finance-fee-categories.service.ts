import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isDuplicateEntryError } from '../../common/duplicate-entry-error';
import { FinanceFeeCategoriesRepository } from './repositories/finance-fee-categories.repository';
import { FinanceFeeCategory } from './entities/finance-fee-category.entity';
import { CreateFeeCategoryDto } from './dto/create-fee-category.dto';
import { UpdateFeeCategoryDto } from './dto/update-fee-category.dto';

@Injectable()
export class FinanceFeeCategoriesService {
  constructor(private readonly categories: FinanceFeeCategoriesRepository) {}

  list(schoolId: string): Promise<FinanceFeeCategory[]> {
    return this.categories.findBySchool(schoolId);
  }

  async create(
    schoolId: string,
    dto: CreateFeeCategoryDto,
  ): Promise<FinanceFeeCategory> {
    try {
      return await this.categories.save(
        this.categories.create({
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
          `A fee category named "${dto.name}" already exists for this school`,
        );
      }
      throw error;
    }
  }

  async update(
    schoolId: string,
    id: string,
    dto: UpdateFeeCategoryDto,
  ): Promise<FinanceFeeCategory> {
    const category = await this.getOwned(schoolId, id);
    Object.assign(category, dto);

    try {
      return await this.categories.save(category);
    } catch (error) {
      if (isDuplicateEntryError(error)) {
        throw new ConflictException(
          `A fee category named "${category.name}" already exists for this school`,
        );
      }
      throw error;
    }
  }

  async remove(schoolId: string, id: string): Promise<void> {
    const category = await this.getOwned(schoolId, id);
    await this.categories.softRemove(category);
  }

  /** Also used by FinanceFeesService/FinanceInvoiceFeesService to authorize a category id. */
  async getOwned(schoolId: string, id: string): Promise<FinanceFeeCategory> {
    const category = await this.categories.findByIdAndSchool(id, schoolId);
    if (!category) {
      throw new NotFoundException('Fee category not found');
    }
    return category;
  }
}
