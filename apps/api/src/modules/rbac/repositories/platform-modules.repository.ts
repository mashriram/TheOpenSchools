import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { PlatformModule } from '../entities/platform-module.entity';

@Injectable()
export class PlatformModulesRepository extends Repository<PlatformModule> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(PlatformModule, dataSource.createEntityManager());
  }

  findByName(name: string): Promise<PlatformModule | null> {
    return this.findOne({ where: { name } });
  }
}
