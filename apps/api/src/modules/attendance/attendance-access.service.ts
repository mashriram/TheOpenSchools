import { ForbiddenException, Injectable } from '@nestjs/common';
import { In } from 'typeorm';
import { RolesRepository } from '../rbac/repositories/roles.repository';
import { FamilyAdultsRepository } from '../people/repositories/family-adults.repository';
import { FamilyChildrenRepository } from '../people/repositories/family-children.repository';

/**
 * `attendance.records.view` is broadly granted by default (Admin/Teacher/
 * Student/Parent, matching Gibbon's real 'Student History_all'/'_myChildren'/
 * '_my' defaults collapsed into one action - see attendance-rbac-catalog.ts).
 * This is the service-level gate CASL's coarse guard-level check can't
 * express: Staff/Other may query any person in the school; a Student may
 * only query their own; a Parent may query their own or a child they have
 * `childDataAccess` for - exactly mirroring
 * TimetableReadModelService.assertCanViewSchedule.
 */
@Injectable()
export class AttendanceAccessService {
  constructor(
    private readonly roles: RolesRepository,
    private readonly familyAdults: FamilyAdultsRepository,
    private readonly familyChildren: FamilyChildrenRepository,
  ) {}

  async assertCanViewAttendance(
    callerPersonId: string,
    activeRoleId: string,
    targetPersonId: string,
  ): Promise<void> {
    if (callerPersonId === targetPersonId) {
      return;
    }
    const role = await this.roles.findOne({ where: { id: activeRoleId } });
    if (role?.category === 'Staff' || role?.category === 'Other') {
      return;
    }
    if (role?.category === 'Parent') {
      const accessibleFamilyIds = (
        await this.familyAdults.find({
          where: { personId: callerPersonId, childDataAccess: true },
        })
      ).map((adult) => adult.familyId);
      if (accessibleFamilyIds.length > 0) {
        const child = await this.familyChildren.findOne({
          where: {
            personId: targetPersonId,
            familyId: In(accessibleFamilyIds),
          },
        });
        if (child) {
          return;
        }
      }
    }
    throw new ForbiddenException(
      'You do not have access to view this attendance record',
    );
  }
}
