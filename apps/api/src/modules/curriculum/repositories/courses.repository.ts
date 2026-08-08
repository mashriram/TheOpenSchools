import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Course } from '../entities/course.entity';

@Injectable()
export class CoursesRepository extends Repository<Course> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(Course, dataSource.createEntityManager());
  }

  findBySchool(schoolId: string, schoolYearId?: string): Promise<Course[]> {
    return this.find({
      where: schoolYearId ? { schoolId, schoolYearId } : { schoolId },
      order: { sequenceNumber: 'ASC' },
    });
  }

  findByIdAndSchool(id: string, schoolId: string): Promise<Course | null> {
    return this.findOne({ where: { id, schoolId } });
  }
}
