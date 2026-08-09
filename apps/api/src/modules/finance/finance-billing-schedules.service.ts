import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isDuplicateEntryError } from '../../common/duplicate-entry-error';
import { FinanceBillingSchedulesRepository } from './repositories/finance-billing-schedules.repository';
import { SchoolYearsRepository } from '../school/repositories/school-years.repository';
import { FinanceBillingSchedule } from './entities/finance-billing-schedule.entity';
import { CreateBillingScheduleDto } from './dto/create-billing-schedule.dto';
import { UpdateBillingScheduleDto } from './dto/update-billing-schedule.dto';

@Injectable()
export class FinanceBillingSchedulesService {
  constructor(
    private readonly schedules: FinanceBillingSchedulesRepository,
    private readonly schoolYears: SchoolYearsRepository,
  ) {}

  async list(
    schoolId: string,
    schoolYearId: string,
  ): Promise<FinanceBillingSchedule[]> {
    await this.assertSchoolYearBelongsToSchool(schoolId, schoolYearId);
    return this.schedules.findBySchoolYear(schoolYearId);
  }

  async create(
    schoolId: string,
    schoolYearId: string,
    dto: CreateBillingScheduleDto,
  ): Promise<FinanceBillingSchedule> {
    await this.assertSchoolYearBelongsToSchool(schoolId, schoolYearId);

    try {
      return await this.schedules.save(
        this.schedules.create({
          schoolYearId,
          name: dto.name,
          description: dto.description ?? null,
          active: dto.active ?? true,
          invoiceIssueDate: dto.invoiceIssueDate ?? null,
          invoiceDueDate: dto.invoiceDueDate ?? null,
        }),
      );
    } catch (error) {
      if (isDuplicateEntryError(error)) {
        throw new ConflictException(
          `A billing schedule named "${dto.name}" already exists for this school year`,
        );
      }
      throw error;
    }
  }

  async update(
    schoolId: string,
    id: string,
    dto: UpdateBillingScheduleDto,
  ): Promise<FinanceBillingSchedule> {
    const schedule = await this.getOwned(schoolId, id);
    Object.assign(schedule, dto);

    try {
      return await this.schedules.save(schedule);
    } catch (error) {
      if (isDuplicateEntryError(error)) {
        throw new ConflictException(
          `A billing schedule named "${schedule.name}" already exists for this school year`,
        );
      }
      throw error;
    }
  }

  async remove(schoolId: string, id: string): Promise<void> {
    const schedule = await this.getOwned(schoolId, id);
    await this.schedules.softRemove(schedule);
  }

  async getOwned(
    schoolId: string,
    id: string,
  ): Promise<FinanceBillingSchedule> {
    const schedule = await this.schedules.findByIdAndSchool(id, schoolId);
    if (!schedule) {
      throw new NotFoundException('Billing schedule not found');
    }
    return schedule;
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
