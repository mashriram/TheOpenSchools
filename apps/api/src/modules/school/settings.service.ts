import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isDuplicateEntryError } from '../../common/duplicate-entry-error';
import { SettingsRepository } from './repositories/settings.repository';
import { Setting } from './entities/setting.entity';
import { CreateSettingDto } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';

@Injectable()
export class SettingsService {
  constructor(private readonly settings: SettingsRepository) {}

  list(schoolId: string): Promise<Setting[]> {
    return this.settings.findBySchool(schoolId);
  }

  async create(schoolId: string, dto: CreateSettingDto): Promise<Setting> {
    try {
      return await this.settings.save(
        this.settings.create({ schoolId, ...dto }),
      );
    } catch (error) {
      if (isDuplicateEntryError(error)) {
        throw new ConflictException(
          `A setting named "${dto.name}" already exists in scope "${dto.scope}"`,
        );
      }
      throw error;
    }
  }

  async update(
    schoolId: string,
    id: string,
    dto: UpdateSettingDto,
  ): Promise<Setting> {
    const setting = await this.getOwned(schoolId, id);
    Object.assign(setting, dto);
    return this.settings.save(setting);
  }

  async remove(schoolId: string, id: string): Promise<void> {
    const setting = await this.getOwned(schoolId, id);
    // No soft-delete: Setting has no deletedAt column (see the entity's
    // docstring) - a hard remove is the right operation here.
    await this.settings.remove(setting);
  }

  private async getOwned(schoolId: string, id: string): Promise<Setting> {
    const setting = await this.settings.findOne({ where: { id, schoolId } });
    if (!setting) {
      throw new NotFoundException('Setting not found');
    }
    return setting;
  }
}
