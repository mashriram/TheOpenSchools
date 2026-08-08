import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { FamilyAdult } from '../entities/family-adult.entity';

@Injectable()
export class FamilyAdultsRepository extends Repository<FamilyAdult> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(FamilyAdult, dataSource.createEntityManager());
  }

  findByFamily(familyId: string): Promise<FamilyAdult[]> {
    return this.find({
      where: { familyId },
      relations: { person: true },
      order: { contactPriority: 'ASC' },
    });
  }
}
