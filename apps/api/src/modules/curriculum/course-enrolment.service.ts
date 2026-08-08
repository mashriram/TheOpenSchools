import { Injectable, NotFoundException } from '@nestjs/common';
import { CourseClassPeopleRepository } from './repositories/course-class-people.repository';
import { CourseClassesService } from './course-classes.service';
import { PeopleRepository } from '../people/repositories/people.repository';
import { CourseClassPerson } from './entities/course-class-person.entity';
import { EnrolPersonDto } from './dto/enrol-person.dto';
import { UpdateEnrolmentDto } from './dto/update-enrolment.dto';

@Injectable()
export class CourseEnrolmentService {
  constructor(
    private readonly courseClassPeople: CourseClassPeopleRepository,
    private readonly courseClasses: CourseClassesService,
    private readonly people: PeopleRepository,
  ) {}

  async list(
    schoolId: string,
    courseClassId: string,
  ): Promise<CourseClassPerson[]> {
    await this.courseClasses.getOwned(schoolId, courseClassId);
    return this.courseClassPeople.findByClass(courseClassId);
  }

  /**
   * Upsert, not insert: one row per (courseClassId, personId). Re-enrolling
   * a previously-unenrolled person updates the existing row (fresh
   * dateEnrolled, cleared dateUnenrolled) instead of creating a second one.
   */
  async enrol(
    schoolId: string,
    courseClassId: string,
    dto: EnrolPersonDto,
  ): Promise<CourseClassPerson> {
    await this.courseClasses.getOwned(schoolId, courseClassId);

    const person = await this.people.findOne({
      where: { id: dto.personId, schoolId },
    });
    if (!person) {
      throw new NotFoundException('Person not found');
    }

    const existing = await this.courseClassPeople.findByClassAndPerson(
      courseClassId,
      dto.personId,
    );

    if (existing) {
      existing.role = dto.role;
      existing.dateEnrolled = this.today();
      existing.dateUnenrolled = null;
      return this.courseClassPeople.save(existing);
    }

    return this.courseClassPeople.save(
      this.courseClassPeople.create({
        courseClassId,
        personId: dto.personId,
        role: dto.role,
        dateEnrolled: this.today(),
        dateUnenrolled: null,
      }),
    );
  }

  async unenrol(
    schoolId: string,
    courseClassId: string,
    enrolmentId: string,
  ): Promise<CourseClassPerson> {
    const enrolment = await this.getOwnedEnrolment(
      schoolId,
      courseClassId,
      enrolmentId,
    );
    enrolment.dateUnenrolled = this.today();
    return this.courseClassPeople.save(enrolment);
  }

  /** Never touches dateEnrolled/dateUnenrolled - only enrol()/unenrol() do. */
  async updateRole(
    schoolId: string,
    courseClassId: string,
    enrolmentId: string,
    dto: UpdateEnrolmentDto,
  ): Promise<CourseClassPerson> {
    const enrolment = await this.getOwnedEnrolment(
      schoolId,
      courseClassId,
      enrolmentId,
    );
    Object.assign(enrolment, dto);
    return this.courseClassPeople.save(enrolment);
  }

  private async getOwnedEnrolment(
    schoolId: string,
    courseClassId: string,
    enrolmentId: string,
  ): Promise<CourseClassPerson> {
    const enrolment = await this.courseClassPeople.findByIdAndSchool(
      enrolmentId,
      schoolId,
    );
    if (!enrolment || enrolment.courseClassId !== courseClassId) {
      throw new NotFoundException('Enrolment not found');
    }
    return enrolment;
  }

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
