import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IndividualNeedInvestigationContributionsRepository } from './repositories/individual-need-investigation-contributions.repository';
import { IndividualNeedInvestigationsService } from './individual-need-investigations.service';
import { PeopleRepository } from '../people/repositories/people.repository';
import { CourseClassPeopleRepository } from '../curriculum/repositories/course-class-people.repository';
import { IndividualNeedInvestigationContribution } from './entities/individual-need-investigation-contribution.entity';
import { CreateContributionDto } from './dto/create-contribution.dto';
import { UpdateContributionDto } from './dto/update-contribution.dto';

@Injectable()
export class IndividualNeedInvestigationContributionsService {
  constructor(
    private readonly contributions: IndividualNeedInvestigationContributionsRepository,
    private readonly investigations: IndividualNeedInvestigationsService,
    private readonly people: PeopleRepository,
    private readonly courseClassPeople: CourseClassPeopleRepository,
  ) {}

  async list(
    schoolId: string,
    investigationId: string,
  ): Promise<IndividualNeedInvestigationContribution[]> {
    await this.investigations.getOwned(schoolId, investigationId);
    return this.contributions.findByInvestigation(investigationId);
  }

  async create(
    schoolId: string,
    investigationId: string,
    dto: CreateContributionDto,
  ): Promise<IndividualNeedInvestigationContribution> {
    await this.investigations.getOwned(schoolId, investigationId);
    const person = await this.people.findOne({
      where: { id: dto.personId, schoolId },
    });
    if (!person) {
      throw new BadRequestException('personId does not belong to this school');
    }
    if (dto.courseClassPersonId) {
      const enrolment = await this.courseClassPeople.findByIdAndSchool(
        dto.courseClassPersonId,
        schoolId,
      );
      if (!enrolment) {
        throw new BadRequestException(
          'courseClassPersonId does not belong to this school',
        );
      }
    }

    return this.contributions.save(
      this.contributions.create({
        investigationId,
        personId: dto.personId,
        type: dto.type ?? 'Teacher',
        courseClassPersonId: dto.courseClassPersonId ?? null,
      }),
    );
  }

  async update(
    schoolId: string,
    id: string,
    dto: UpdateContributionDto,
  ): Promise<IndividualNeedInvestigationContribution> {
    const contribution = await this.getOwned(schoolId, id);
    Object.assign(contribution, dto);
    return this.contributions.save(contribution);
  }

  async getOwned(
    schoolId: string,
    id: string,
  ): Promise<IndividualNeedInvestigationContribution> {
    const contribution = await this.contributions.findByIdAndSchool(
      id,
      schoolId,
    );
    if (!contribution) {
      throw new NotFoundException('Contribution not found');
    }
    return contribution;
  }
}
