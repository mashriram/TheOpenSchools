import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Alert } from '../entities/alert.entity';

@Injectable()
export class AlertsRepository extends Repository<Alert> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(Alert, dataSource.createEntityManager());
  }

  /** Every alert for a person, including adminOnly-typed ones. */
  findByPerson(personId: string): Promise<Alert[]> {
    return this.find({
      where: { personId },
      relations: { alertType: true },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Fixes Gibbon's real bug #1 directly (plan §M19): a caller without
   * `studentAlerts.alerts.view` (Admin-only, unconditioned) never even
   * receives an adminOnly-typed alert row in a list response, not just a
   * client-side-hidden one.
   */
  findByPersonExcludingAdminOnly(personId: string): Promise<Alert[]> {
    return this.createQueryBuilder('alert')
      .innerJoinAndSelect('alert.alertType', 'alertType')
      .where('alert.personId = :personId AND alertType.adminOnly = false', {
        personId,
      })
      .orderBy('alert.createdAt', 'DESC')
      .getMany();
  }

  /** Joins Alert -> SchoolYear to enforce tenant scope. */
  findByIdAndSchool(id: string, schoolId: string): Promise<Alert | null> {
    return this.createQueryBuilder('alert')
      .innerJoinAndSelect('alert.alertType', 'alertType')
      .innerJoin('alert.schoolYear', 'schoolYear')
      .where('alert.id = :id AND schoolYear.schoolId = :schoolId', {
        id,
        schoolId,
      })
      .getOne();
  }
}
