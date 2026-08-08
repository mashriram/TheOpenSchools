import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IndividualNeedInvestigationsRepository } from './repositories/individual-need-investigations.repository';
import { SchoolYearsRepository } from '../school/repositories/school-years.repository';
import { PeopleRepository } from '../people/repositories/people.repository';
import { IndividualNeedInvestigation } from './entities/individual-need-investigation.entity';
import { CreateInvestigationDto } from './dto/create-investigation.dto';
import { UpdateInvestigationDto } from './dto/update-investigation.dto';

@Injectable()
export class IndividualNeedInvestigationsService {
  constructor(
    private readonly investigations: IndividualNeedInvestigationsRepository,
    private readonly schoolYears: SchoolYearsRepository,
    private readonly people: PeopleRepository,
  ) {}

  async listForStudent(
    schoolId: string,
    studentPersonId: string,
  ): Promise<IndividualNeedInvestigation[]> {
    await this.assertPersonBelongsToSchool(schoolId, studentPersonId);
    return this.investigations.findByStudent(studentPersonId);
  }

  async create(
    schoolId: string,
    creatorPersonId: string,
    dto: CreateInvestigationDto,
  ): Promise<IndividualNeedInvestigation> {
    const schoolYear = await this.schoolYears.findOne({
      where: { id: dto.schoolYearId, schoolId },
    });
    if (!schoolYear) {
      throw new BadRequestException(
        'schoolYearId does not belong to this school',
      );
    }
    await this.assertPersonBelongsToSchool(schoolId, dto.studentPersonId);

    return this.investigations.save(
      this.investigations.create({
        schoolYearId: dto.schoolYearId,
        creatorPersonId,
        studentPersonId: dto.studentPersonId,
        date: dto.date,
        reason: dto.reason,
        strategiesTried: dto.strategiesTried ?? null,
        parentsInformed: dto.parentsInformed ?? false,
      }),
    );
  }

  async update(
    schoolId: string,
    id: string,
    dto: UpdateInvestigationDto,
  ): Promise<IndividualNeedInvestigation> {
    const investigation = await this.getOwned(schoolId, id);
    Object.assign(investigation, dto);
    return this.investigations.save(investigation);
  }

  async getOwned(
    schoolId: string,
    id: string,
  ): Promise<IndividualNeedInvestigation> {
    const investigation = await this.investigations.findByIdAndSchool(
      id,
      schoolId,
    );
    if (!investigation) {
      throw new NotFoundException('Investigation not found');
    }
    return investigation;
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
