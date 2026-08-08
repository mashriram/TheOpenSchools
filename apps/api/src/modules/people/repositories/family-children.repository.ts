import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { FamilyChild } from '../entities/family-child.entity';

@Injectable()
export class FamilyChildrenRepository extends Repository<FamilyChild> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(FamilyChild, dataSource.createEntityManager());
  }

  findByFamily(familyId: string): Promise<FamilyChild[]> {
    return this.find({
      where: { familyId },
      relations: { person: true },
    });
  }
}
