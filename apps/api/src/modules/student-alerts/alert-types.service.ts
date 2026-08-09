import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isDuplicateEntryError } from '../../common/duplicate-entry-error';
import { AlertTypesRepository } from './repositories/alert-types.repository';
import { AlertType } from './entities/alert-type.entity';
import { CreateAlertTypeDto } from './dto/create-alert-type.dto';
import { UpdateAlertTypeDto } from './dto/update-alert-type.dto';

@Injectable()
export class AlertTypesService {
  constructor(private readonly alertTypes: AlertTypesRepository) {}

  list(schoolId: string): Promise<AlertType[]> {
    return this.alertTypes.findBySchool(schoolId);
  }

  async create(schoolId: string, dto: CreateAlertTypeDto): Promise<AlertType> {
    try {
      return await this.alertTypes.save(
        this.alertTypes.create({
          schoolId,
          name: dto.name,
          tag: dto.tag ?? null,
          active: dto.active ?? true,
          adminOnly: dto.adminOnly ?? true,
          useLevels: dto.useLevels ?? true,
          type: dto.type ?? 'Additional',
          color: dto.color ?? null,
          colorBG: dto.colorBG ?? null,
          description: dto.description ?? null,
          thresholdLow: dto.thresholdLow ?? null,
          thresholdMed: dto.thresholdMed ?? null,
          thresholdHigh: dto.thresholdHigh ?? null,
          sequenceNumber: dto.sequenceNumber ?? 0,
        }),
      );
    } catch (error) {
      if (isDuplicateEntryError(error)) {
        throw new ConflictException(
          `An alert type named "${dto.name}" already exists for this school`,
        );
      }
      throw error;
    }
  }

  async update(
    schoolId: string,
    id: string,
    dto: UpdateAlertTypeDto,
  ): Promise<AlertType> {
    const alertType = await this.getOwned(schoolId, id);
    Object.assign(alertType, dto);

    try {
      return await this.alertTypes.save(alertType);
    } catch (error) {
      if (isDuplicateEntryError(error)) {
        throw new ConflictException(
          `An alert type named "${alertType.name}" already exists for this school`,
        );
      }
      throw error;
    }
  }

  async remove(schoolId: string, id: string): Promise<void> {
    const alertType = await this.getOwned(schoolId, id);
    await this.alertTypes.softRemove(alertType);
  }

  /** Also used by AlertsService to authorize an AlertType id. */
  async getOwned(schoolId: string, id: string): Promise<AlertType> {
    const alertType = await this.alertTypes.findByIdAndSchool(id, schoolId);
    if (!alertType) {
      throw new NotFoundException('Alert type not found');
    }
    return alertType;
  }
}
