import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ScaleGrade } from '../entities/scale-grade.entity';

@Injectable()
export class ScaleGradesRepository extends Repository<ScaleGrade> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(ScaleGrade, dataSource.createEntityManager());
  }

  findByScale(scaleId: string): Promise<ScaleGrade[]> {
    return this.find({
      where: { scaleId },
      order: { sequenceNumber: 'ASC' },
    });
  }

  findLowestAcceptable(scaleId: string): Promise<ScaleGrade | null> {
    return this.findOne({ where: { scaleId, lowestAcceptable: true } });
  }

  /** Joins ScaleGrade -> Scale to enforce tenant scope. */
  findByIdAndSchool(id: string, schoolId: string): Promise<ScaleGrade | null> {
    return this.createQueryBuilder('grade')
      .innerJoin('grade.scale', 'scale')
      .where('grade.id = :id AND scale.schoolId = :schoolId', {
        id,
        schoolId,
      })
      .getOne();
  }
}
