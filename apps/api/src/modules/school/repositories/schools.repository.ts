import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { School } from '../entities/school.entity';

@Injectable()
export class SchoolsRepository extends Repository<School> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(School, dataSource.createEntityManager());
  }

  findBySlug(subdomainSlug: string): Promise<School | null> {
    return this.findOne({ where: { subdomainSlug } });
  }
}
