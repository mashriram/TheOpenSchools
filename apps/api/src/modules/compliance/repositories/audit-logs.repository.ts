import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { AuditLog } from '../entities/audit-log.entity';

@Injectable()
export class AuditLogsRepository extends Repository<AuditLog> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(AuditLog, dataSource.createEntityManager());
  }

  findByEntity(entityName: string, entityId: string): Promise<AuditLog[]> {
    return this.find({
      where: { entityName, entityId },
      order: { createdAt: 'ASC' },
    });
  }
}
