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

  findByPersonAndFormGroup(
    personId: string,
    formGroupId: string,
  ): Promise<StudentEnrolment | null> {
    return this.findOne({ where: { personId, formGroupId } });
  }
}
