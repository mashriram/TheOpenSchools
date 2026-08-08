import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FacilityBookingsRepository } from './repositories/facility-bookings.repository';
import { SpacesRepository } from '../school/repositories/spaces.repository';
import { PeopleRepository } from '../people/repositories/people.repository';
import { FacilityBooking } from './entities/facility-booking.entity';
import { CreateFacilityBookingDto } from './dto/create-facility-booking.dto';
import { UpdateFacilityBookingDto } from './dto/update-facility-booking.dto';

@Injectable()
export class FacilityBookingsService {
  constructor(
    private readonly bookings: FacilityBookingsRepository,
    private readonly spaces: SpacesRepository,
    private readonly people: PeopleRepository,
  ) {}

  list(
    schoolId: string,
    dateStart: string,
    dateEnd: string,
  ): Promise<FacilityBooking[]> {
    return this.bookings.findBySchoolAndDateRange(schoolId, dateStart, dateEnd);
  }

  async create(
    schoolId: string,
    dto: CreateFacilityBookingDto,
  ): Promise<FacilityBooking> {
    await this.assertOwnership(schoolId, dto.spaceId, dto.personId);
    await this.assertNoOverlap(
      dto.spaceId,
      dto.date,
      dto.timeStart,
      dto.timeEnd,
    );

    return this.bookings.save(this.bookings.create(dto));
  }

  async update(
    schoolId: string,
    id: string,
    dto: UpdateFacilityBookingDto,
  ): Promise<FacilityBooking> {
    const booking = await this.getOwned(schoolId, id);
    await this.assertOwnership(
      schoolId,
      dto.spaceId ?? booking.spaceId,
      dto.personId ?? booking.personId,
    );
    await this.assertNoOverlap(
      dto.spaceId ?? booking.spaceId,
      dto.date ?? booking.date,
      dto.timeStart ?? booking.timeStart,
      dto.timeEnd ?? booking.timeEnd,
      id,
    );
    Object.assign(booking, dto);
    return this.bookings.save(booking);
  }

  async remove(schoolId: string, id: string): Promise<void> {
    const booking = await this.getOwned(schoolId, id);
    await this.bookings.softRemove(booking);
  }

  private async getOwned(
    schoolId: string,
    id: string,
  ): Promise<FacilityBooking> {
    const booking = await this.bookings.findByIdAndSchool(id, schoolId);
    if (!booking) {
      throw new NotFoundException('Facility booking not found');
    }
    return booking;
  }

  private async assertOwnership(
    schoolId: string,
    spaceId: string,
    personId: string,
  ): Promise<void> {
    const [space, person] = await Promise.all([
      this.spaces.findOne({ where: { id: spaceId, schoolId } }),
      this.people.findOne({ where: { id: personId, schoolId } }),
    ]);
    if (!space) {
      throw new BadRequestException('spaceId does not belong to this school');
    }
    if (!person) {
      throw new BadRequestException('personId does not belong to this school');
    }
  }

  private async assertNoOverlap(
    spaceId: string,
    date: string,
    timeStart: string,
    timeEnd: string,
    excludeBookingId?: string,
  ): Promise<void> {
    const overlapping = await this.bookings.findOverlapping(
      spaceId,
      date,
      timeStart,
      timeEnd,
      excludeBookingId,
    );
    if (overlapping) {
      throw new ConflictException(
        'This space is already booked for an overlapping time on that date',
      );
    }
  }
}
