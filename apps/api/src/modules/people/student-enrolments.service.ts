import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isDuplicateEntryError } from '../../common/duplicate-entry-error';
import { PeopleRepository } from './repositories/people.repository';
import { StudentEnrolmentsRepository } from './repositories/student-enrolments.repository';
import { SchoolYearsRepository } from '../school/repositories/school-years.repository';
import { YearGroupsRepository } from '../school/repositories/year-groups.repository';
import { FormGroupsRepository } from '../school/repositories/form-groups.repository';
import { StudentEnrolment } from './entities/student-enrolment.entity';
import { CreateStudentEnrolmentDto } from './dto/create-student-enrolment.dto';
import { UpdateStudentEnrolmentDto } from './dto/update-student-enrolment.dto';

@Injectable()
export class StudentEnrolmentsService {
  constructor(
    private readonly people: PeopleRepository,
    private readonly enrolments: StudentEnrolmentsRepository,
    private readonly schoolYears: SchoolYearsRepository,
    private readonly yearGroups: YearGroupsRepository,
    private readonly formGroups: FormGroupsRepository,
  ) {}

  async list(schoolId: string, personId: string): Promise<StudentEnrolment[]> {
    await this.assertPersonBelongsToSchool(schoolId, personId);
    return this.enrolments.findByPerson(personId);
  }

  async create(
    schoolId: string,
    personId: string,
    dto: CreateStudentEnrolmentDto,
  ): Promise<StudentEnrolment> {
    await this.assertPersonBelongsToSchool(schoolId, personId);
    await this.assertSchoolYearBelongsToSchool(schoolId, dto.schoolYearId);
    await this.assertYearGroupBelongsToSchool(schoolId, dto.yearGroupId);
    await this.assertFormGroupInSchoolYear(dto.schoolYearId, dto.formGroupId);

    try {
      return await this.enrolments.save(
        this.enrolments.create({
          personId,
          schoolYearId: dto.schoolYearId,
          yearGroupId: dto.yearGroupId,
          formGroupId: dto.formGroupId,
          rollOrder: dto.rollOrder ?? null,
        }),
      );
    } catch (error) {
      if (isDuplicateEntryError(error)) {
        throw new ConflictException(
          'This person already has an enrolment for that school year',
        );
      }
      throw error;
    }
  }

  async update(
    schoolId: string,
    personId: string,
    enrolmentId: string,
    dto: UpdateStudentEnrolmentDto,
  ): Promise<StudentEnrolment> {
    const enrolment = await this.getOwned(schoolId, personId, enrolmentId);
    if (dto.yearGroupId) {
      await this.assertYearGroupBelongsToSchool(schoolId, dto.yearGroupId);
    }
    if (dto.formGroupId) {
      await this.assertFormGroupInSchoolYear(
        enrolment.schoolYearId,
        dto.formGroupId,
      );
    }
    Object.assign(enrolment, dto);
    return this.enrolments.save(enrolment);
  }

  async remove(
    schoolId: string,
    personId: string,
    enrolmentId: string,
  ): Promise<void> {
    const enrolment = await this.getOwned(schoolId, personId, enrolmentId);
    await this.enrolments.softRemove(enrolment);
  }

  private async getOwned(
    schoolId: string,
    personId: string,
    enrolmentId: string,
  ): Promise<StudentEnrolment> {
    await this.assertPersonBelongsToSchool(schoolId, personId);
    const enrolment = await this.enrolments.findOne({
      where: { id: enrolmentId, personId },
    });
    if (!enrolment) {
      throw new NotFoundException('Enrolment not found');
    }
    return enrolment;
  }

  private async assertPersonBelongsToSchool(
    schoolId: string,
    personId: string,
  ): Promise<void> {
    const person = await this.people.findOne({
      where: { id: personId, schoolId },
    });
    if (!person) {
      throw new NotFoundException('Person not found');
    }
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

  private async assertYearGroupBelongsToSchool(
    schoolId: string,
    yearGroupId: string,
  ): Promise<void> {
    const yearGroup = await this.yearGroups.findOne({
      where: { id: yearGroupId, schoolId },
    });
    if (!yearGroup) {
      throw new BadRequestException(
        'yearGroupId does not belong to this school',
      );
    }
  }

  private async assertFormGroupInSchoolYear(
    schoolYearId: string,
    formGroupId: string,
  ): Promise<void> {
    const formGroup = await this.formGroups.findOne({
      where: { id: formGroupId, schoolYearId },
    });
    if (!formGroup) {
      throw new BadRequestException(
        'formGroupId does not belong to the given schoolYearId',
      );
    }
  }
}
