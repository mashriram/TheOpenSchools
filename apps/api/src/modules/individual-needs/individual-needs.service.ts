import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IndividualNeedsRepository } from './repositories/individual-needs.repository';
import { IndividualNeedPersonDescriptorsRepository } from './repositories/individual-need-person-descriptors.repository';
import { PeopleRepository } from '../people/repositories/people.repository';
import type { AppAbility } from '../rbac/casl-ability.factory';
import { IndividualNeed } from './entities/individual-need.entity';
import { IndividualNeedPersonDescriptor } from './entities/individual-need-person-descriptor.entity';
import { UpsertIndividualNeedDto } from './dto/upsert-individual-need.dto';
import { SetPersonDescriptorDto } from './dto/set-person-descriptor.dto';
import type {
  IndividualNeedsDetailDto,
  IndividualNeedsSummaryDto,
} from './individual-needs-view.dto';

@Injectable()
export class IndividualNeedsService {
  constructor(
    private readonly needs: IndividualNeedsRepository,
    private readonly descriptors: IndividualNeedPersonDescriptorsRepository,
    private readonly people: PeopleRepository,
  ) {}

  /**
   * Decides the response shape from the caller's actual ability, not from
   * which endpoint they hit - the fix for Gibbon's real read-side gap (see
   * individual-needs-view.dto.ts's doc comment).
   */
  async getForCaller(
    schoolId: string,
    personId: string,
    ability: AppAbility,
  ): Promise<IndividualNeedsSummaryDto | IndividualNeedsDetailDto> {
    if (ability.can('view', 'IndividualNeedDetail')) {
      return this.getDetail(schoolId, personId);
    }
    return this.getSummary(schoolId, personId);
  }

  async getSummary(
    schoolId: string,
    personId: string,
  ): Promise<IndividualNeedsSummaryDto> {
    await this.assertPersonBelongsToSchool(schoolId, personId);
    const rows = await this.descriptors.findByPerson(personId);
    return {
      personId,
      descriptors: rows.map((row) => ({
        id: row.id,
        descriptor: row.descriptor,
        level: row.level,
      })),
    };
  }

  async getDetail(
    schoolId: string,
    personId: string,
  ): Promise<IndividualNeedsDetailDto> {
    const summary = await this.getSummary(schoolId, personId);
    const need = await this.needs.findByPerson(personId);
    return {
      ...summary,
      strategies: need?.strategies ?? null,
      targets: need?.targets ?? null,
      notes: need?.notes ?? null,
      customFields: need?.customFields ?? null,
    };
  }

  async upsert(
    schoolId: string,
    personId: string,
    dto: UpsertIndividualNeedDto,
  ): Promise<IndividualNeed> {
    await this.assertPersonBelongsToSchool(schoolId, personId);
    const existing = await this.needs.findByPerson(personId);
    const need = existing ?? this.needs.create({ personId });
    Object.assign(need, dto);
    return this.needs.save(need);
  }

  async setDescriptor(
    schoolId: string,
    personId: string,
    dto: SetPersonDescriptorDto,
  ): Promise<IndividualNeedPersonDescriptor> {
    await this.assertPersonBelongsToSchool(schoolId, personId);
    const existing = await this.descriptors.findOne({
      where: { personId, descriptor: dto.descriptor },
    });
    const row =
      existing ??
      this.descriptors.create({ personId, descriptor: dto.descriptor });
    row.level = dto.level ?? null;
    return this.descriptors.save(row);
  }

  async removeDescriptor(schoolId: string, id: string): Promise<void> {
    const row = await this.descriptors.findByIdAndSchool(id, schoolId);
    if (!row) {
      throw new NotFoundException('Descriptor not found');
    }
    await this.descriptors.remove(row);
  }

  private async assertPersonBelongsToSchool(
    schoolId: string,
    personId: string,
  ): Promise<void> {
    const person = await this.people.findOne({
      where: { id: personId, schoolId },
    });
    if (!person) {
      throw new BadRequestException('personId does not belong to this school');
    }
  }
}
