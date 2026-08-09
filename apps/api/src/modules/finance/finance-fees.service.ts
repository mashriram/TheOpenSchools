import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isDuplicateEntryError } from '../../common/duplicate-entry-error';
import { FinanceFeesRepository } from './repositories/finance-fees.repository';
import { FinanceFeeCategoriesService } from './finance-fee-categories.service';
import { SchoolYearsRepository } from '../school/repositories/school-years.repository';
import { FinanceFee } from './entities/finance-fee.entity';
import { CreateFeeDto } from './dto/create-fee.dto';
import { UpdateFeeDto } from './dto/update-fee.dto';

@Injectable()
export class FinanceFeesService {
  constructor(
    private readonly fees: FinanceFeesRepository,
    private readonly feeCategories: FinanceFeeCategoriesService,
    private readonly schoolYears: SchoolYearsRepository,
  ) {}

  async list(schoolId: string, schoolYearId: string): Promise<FinanceFee[]> {
    await this.assertSchoolYearBelongsToSchool(schoolId, schoolYearId);
    return this.fees.findBySchoolYear(schoolYearId);
  }

  async create(
    schoolId: string,
    schoolYearId: string,
    dto: CreateFeeDto,
  ): Promise<FinanceFee> {
    await this.assertSchoolYearBelongsToSchool(schoolId, schoolYearId);
    await this.feeCategories.getOwned(schoolId, dto.feeCategoryId);

    try {
      return await this.fees.save(
        this.fees.create({
          schoolYearId,
          name: dto.name,
          shortName: dto.shortName,
          description: dto.description ?? null,
          active: dto.active ?? true,
          feeCategoryId: dto.feeCategoryId,
          amount: dto.amount,
        }),
      );
    } catch (error) {
      if (isDuplicateEntryError(error)) {
        throw new ConflictException(
          `A fee with short name "${dto.shortName}" already exists for this school year`,
        );
      }
      throw error;
    }
  }

  async update(
    schoolId: string,
    id: string,
    dto: UpdateFeeDto,
  ): Promise<FinanceFee> {
    const fee = await this.getOwned(schoolId, id);
    if (dto.feeCategoryId) {
      await this.feeCategories.getOwned(schoolId, dto.feeCategoryId);
    }
    Object.assign(fee, dto);

    try {
      return await this.fees.save(fee);
    } catch (error) {
      if (isDuplicateEntryError(error)) {
        throw new ConflictException(
          `A fee with short name "${fee.shortName}" already exists for this school year`,
        );
      }
      throw error;
    }
  }

  async remove(schoolId: string, id: string): Promise<void> {
    const fee = await this.getOwned(schoolId, id);
    await this.fees.softRemove(fee);
  }

  /** Also used by FinanceInvoiceFeesService to authorize a fee id. */
  async getOwned(schoolId: string, id: string): Promise<FinanceFee> {
    const fee = await this.fees.findByIdAndSchool(id, schoolId);
    if (!fee) {
      throw new NotFoundException('Fee not found');
    }
    return fee;
  }

  private async assertSchoolYearBelongsToSchool(
    schoolId: string,
    schoolYearId: string,
  ): Promise<void> {
    const schoolYear = await this.schoolYears.findOne({
      where: { id: schoolYearId, schoolId },
    });
    if (!schoolYear) {
      throw new BadRequestException(
        'schoolYearId does not belong to this school',
      );
    }
  }
}
