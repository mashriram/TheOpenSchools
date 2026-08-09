import { Injectable } from '@nestjs/common';
import { TimetableReadModelService } from '../timetable/timetable-read-model.service';
import { FacilityBookingsRepository } from '../timetable/repositories/facility-bookings.repository';
import { CalendarEventsService } from './calendar-events.service';
import type { ScheduledPeriod } from '../timetable/timetable-read-model.service';
import type { CalendarEvent } from './entities/calendar-event.entity';
import type { FacilityBooking } from '../timetable/entities/facility-booking.entity';

export interface MergedSchedule {
  periods: ScheduledPeriod[];
  events: CalendarEvent[];
  facilityBookings: FacilityBooking[];
}

/**
 * The shared read endpoint the plan calls for (§M22): "GET /me/schedule?
 * date= merging Timetable periods + Calendar events + Space bookings"
 * rather than replicating Gibbon's PHP "Layers" class hierarchy - a plain
 * server-side composition of three already-independent read-models, kept
 * as three separate lists rather than a unified/lossy common shape (simpler,
 * and lets the frontend render each kind differently anyway).
 *
 * Access is asymmetric by design: `periods`/`facilityBookings` are about
 * the *target* person's own data (self/child/staff, reusing Timetable's
 * existing gate) - `events` are filtered by the *caller's* own Calendar
 * visibility (Calendar's ACL is about the viewer's role, not the target's
 * identity, matching Gibbon's real container-level model).
 */
@Injectable()
export class MyScheduleService {
  constructor(
    private readonly timetableReadModel: TimetableReadModelService,
    private readonly facilityBookings: FacilityBookingsRepository,
    private readonly calendarEvents: CalendarEventsService,
  ) {}

  async getMergedSchedule(
    schoolId: string,
    schoolYearId: string,
    targetPersonId: string,
    callerPersonId: string,
    activeRoleId: string,
    dateStart: string,
    dateEnd: string,
  ): Promise<MergedSchedule> {
    await this.timetableReadModel.assertCanViewSchedule(
      callerPersonId,
      activeRoleId,
      targetPersonId,
    );

    const [periods, facilityBookingRows, events] = await Promise.all([
      this.timetableReadModel.getScheduleForPerson(
        schoolId,
        targetPersonId,
        dateStart,
        dateEnd,
      ),
      this.facilityBookings.findByPersonAndDateRange(
        targetPersonId,
        dateStart,
        dateEnd,
      ),
      this.calendarEvents.listVisibleEventsInRange(
        schoolId,
        schoolYearId,
        dateStart,
        dateEnd,
        callerPersonId,
        activeRoleId,
      ),
    ]);

    return { periods, events, facilityBookings: facilityBookingRows };
  }
}
