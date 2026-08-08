import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Permission } from '../entities/permission.entity';

@Injectable()
export class PermissionsRepository extends Repository<Permission> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(Permission, dataSource.createEntityManager());
  }

  findByRole(roleId: string): Promise<Permission[]> {
    return this.find({
      where: { roleId },
      relations: { action: { module: true } },
    });
  }
}
