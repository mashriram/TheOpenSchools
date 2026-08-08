import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Unit } from '../entities/unit.entity';

@Injectable()
export class UnitsRepository extends Repository<Unit> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(Unit, dataSource.createEntityManager());
  }

  findByCourse(courseId: string): Promise<Unit[]> {
    return this.find({
      where: { courseId },
      order: { sequenceNumber: 'ASC' },
    });
  }

  findByIdAndSchool(id: string, schoolId: string): Promise<Unit | null> {
    return this.createQueryBuilder('unit')
      .innerJoin('unit.course', 'course')
      .where('unit.id = :id AND course.schoolId = :schoolId', {
        id,
        schoolId,
      })
      .getOne();
  }
}
