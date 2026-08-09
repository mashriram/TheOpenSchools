import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { Between, DataSource, Repository } from 'typeorm';
import { FacilityBooking } from '../entities/facility-booking.entity';

@Injectable()
export class FacilityBookingsRepository extends Repository<FacilityBooking> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(FacilityBooking, dataSource.createEntityManager());
  }

  findBySchoolAndDateRange(
    schoolId: string,
    dateStart: string,
    dateEnd: string,
  ): Promise<FacilityBooking[]> {
    return this.createQueryBuilder('booking')
      .innerJoin('booking.space', 'space')
      .where('space.schoolId = :schoolId', { schoolId })
      .andWhere('booking.date BETWEEN :dateStart AND :dateEnd', {
        dateStart,
        dateEnd,
      })
      .orderBy('booking.date', 'ASC')
      .addOrderBy('booking.timeStart', 'ASC')
      .getMany();
  }

  /** Used by Calendar's merged "my schedule" read-model (plan §M22). */
  findByPersonAndDateRange(
    personId: string,
    dateStart: string,
    dateEnd: string,
  ): Promise<FacilityBooking[]> {
    return this.find({
      where: { personId, date: Between(dateStart, dateEnd) },
      relations: { space: true },
      order: { date: 'ASC', timeStart: 'ASC' },
    });
  }

  findByIdAndSchool(
    id: string,
    schoolId: string,
  ): Promise<FacilityBooking | null> {
    return this.createQueryBuilder('booking')
      .innerJoin('booking.space', 'space')
      .where('booking.id = :id', { id })
      .andWhere('space.schoolId = :schoolId', { schoolId })
      .getOne();
  }

  /** Overlap: existing.start < new.end AND existing.end > new.start, on the same date/space. */
  async findOverlapping(
    spaceId: string,
    date: string,
    timeStart: string,
    timeEnd: string,
    excludeBookingId?: string,
  ): Promise<FacilityBooking | null> {
    const qb = this.createQueryBuilder('booking')
      .where('booking.spaceId = :spaceId', { spaceId })
      .andWhere('booking.date = :date', { date })
      .andWhere('booking.timeStart < :timeEnd', { timeEnd })
      .andWhere('booking.timeEnd > :timeStart', { timeStart });
    if (excludeBookingId) {
      qb.andWhere('booking.id != :excludeBookingId', { excludeBookingId });
    }
    return qb.getOne();
  }
}
