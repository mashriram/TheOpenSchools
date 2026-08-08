import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CourseYearGroup } from '../entities/course-year-group.entity';

@Injectable()
export class CourseYearGroupsRepository extends Repository<CourseYearGroup> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(CourseYearGroup, dataSource.createEntityManager());
  }

  findByCourse(courseId: string): Promise<CourseYearGroup[]> {
    return this.find({ where: { courseId } });
  }

  async deleteByCourse(courseId: string): Promise<void> {
    await this.delete({ courseId });
  }
}
