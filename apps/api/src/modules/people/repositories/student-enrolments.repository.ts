import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { StudentEnrolment } from '../entities/student-enrolment.entity';

@Injectable()
export class StudentEnrolmentsRepository extends Repository<StudentEnrolment> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(StudentEnrolment, dataSource.createEntityManager());
  }

  findByPerson(personId: string): Promise<StudentEnrolment[]> {
    return this.find({
      where: { personId },
      relations: { schoolYear: true, yearGroup: true, formGroup: true },
    });
  }

  findByPersonAndSchoolYear(
    personId: string,
    schoolYearId: string,
  ): Promise<StudentEnrolment | null> {
    return this.findOne({ where: { personId, schoolYearId } });
  }

  findByFormGroup(formGroupId: string): Promise<StudentEnrolment[]> {
    return this.find({ where: { formGroupId } });
  }

  /**
   * Used by Messenger (M23) to resolve a YearGroup-type audience target.
   * Scoped to a specific school year - YearGroup itself (unlike FormGroup)
   * has no schoolYearId of its own, so without this filter a "Year 7"
   * target would resolve to every historical year's Year 7 students.
   */
  findByYearGroupAndSchoolYear(
    yearGroupId: string,
    schoolYearId: string,
  ): Promise<StudentEnrolment[]> {
    return this.find({ where: { yearGroupId, schoolYearId } });
  }

  findByPersonAndFormGroup(
    personId: string,
    formGroupId: string,
  ): Promise<StudentEnrolment | null> {
    return this.findOne({ where: { personId, formGroupId } });
  }
}
