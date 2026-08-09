import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { subject } from '@casl/ability';
import { AlertsRepository } from './repositories/alerts.repository';
import { AlertTypesService } from './alert-types.service';
import { SchoolYearsRepository } from '../school/repositories/school-years.repository';
import { PeopleRepository } from '../people/repositories/people.repository';
import { CourseClassesRepository } from '../curriculum/repositories/course-classes.repository';
import { assertCan } from '../rbac/authorize';
import type { AppAbility } from '../rbac/casl-ability.factory';
import { Alert } from './entities/alert.entity';
import { CreateAlertDto } from './dto/create-alert.dto';
import { UpdateAlertDto } from './dto/update-alert.dto';
import type { AlertBadgeDto } from './alert-badge.dto';

@Injectable()
export class AlertsService {
  constructor(
    private readonly alerts: AlertsRepository,
    private readonly alertTypes: AlertTypesService,
    private readonly schoolYears: SchoolYearsRepository,
    private readonly people: PeopleRepository,
    private readonly courseClasses: CourseClassesRepository,
  ) {}

  async create(
    schoolId: string,
    creatorPersonId: string,
    ability: AppAbility,
    dto: CreateAlertDto,
  ): Promise<Alert> {
    const schoolYear = await this.schoolYears.findOne({
      where: { id: dto.schoolYearId, schoolId },
    });
    if (!schoolYear) {
      throw new BadRequestException(
        'schoolYearId does not belong to this school',
      );
    }
    const person = await this.people.findOne({
      where: { id: dto.personId, schoolId },
    });
    if (!person) {
      throw new BadRequestException('personId does not belong to this school');
    }
    if (dto.courseClassId) {
      const courseClass = await this.courseClasses.findByIdAndSchool(
        dto.courseClassId,
        schoolId,
      );
      if (!courseClass) {
        throw new BadRequestException(
          'courseClassId does not belong to this school',
        );
      }
    }
    const alertType = await this.alertTypes.getOwned(schoolId, dto.alertTypeId);
    this.assertCanManageAlertOfType(ability, alertType.adminOnly);

    return this.alerts.save(
      this.alerts.create({
        schoolYearId: dto.schoolYearId,
        personId: dto.personId,
        courseClassId: dto.courseClassId ?? null,
        alertTypeId: alertType.id,
        context: 'Manual',
        level: dto.level ?? null,
        dateStart: dto.dateStart ?? null,
        dateEnd: dto.dateEnd ?? null,
        comment: dto.comment ?? null,
        createdByPersonId: creatorPersonId,
      }),
    );
  }

  async update(
    schoolId: string,
    id: string,
    statusByPersonId: string,
    ability: AppAbility,
    dto: UpdateAlertDto,
  ): Promise<Alert> {
    const alert = await this.getOwnedForManage(schoolId, id, ability);
    Object.assign(alert, dto);
    if (dto.status) {
      alert.statusByPersonId = statusByPersonId;
      alert.statusAt = new Date();
    }
    return this.alerts.save(alert);
  }

  /**
   * Fixes Gibbon's real bug #1 (plan §M19): a denial here returns 404, so
   * an unauthorized viewer cannot distinguish "this alert doesn't exist"
   * from "it exists but is a Medical/Privacy-type alert you can't see."
   */
  async getVisibleAlert(
    schoolId: string,
    id: string,
    ability: AppAbility,
  ): Promise<Alert> {
    const alert = await this.alerts.findByIdAndSchool(id, schoolId);
    if (!alert) {
      throw new NotFoundException('Alert not found');
    }
    assertCan(ability, 'view', 'Alert', {
      alertTypeAdminOnly: alert.alertType.adminOnly,
    });
    return alert;
  }

  async listForPerson(
    schoolId: string,
    personId: string,
    ability: AppAbility,
  ): Promise<Alert[]> {
    await this.assertPersonBelongsToSchool(schoolId, personId);
    return this.canViewRestrictedAlerts(ability)
      ? this.alerts.findByPerson(personId)
      : this.alerts.findByPersonExcludingAdminOnly(personId);
  }

  /**
   * Fixes Gibbon's real bug #2 (plan §M19): AlertBadgeDto has no `comment`
   * field at all, so no badge/summary response can ever embed Tier C
   * content, structurally - see alert-badge.dto.ts.
   */
  async getBadgesForPerson(
    schoolId: string,
    personId: string,
    ability: AppAbility,
  ): Promise<AlertBadgeDto[]> {
    const alerts = await this.listForPerson(schoolId, personId, ability);
    return alerts.map((alert) => ({
      id: alert.id,
      alertTypeName: alert.alertType.name,
      alertTypeTag: alert.alertType.tag,
      color: alert.alertType.color,
      colorBG: alert.alertType.colorBG,
      level: alert.level,
    }));
  }

  private canViewRestrictedAlerts(ability: AppAbility): boolean {
    const instance = subject('Alert', {
      alertTypeAdminOnly: true,
    }) as unknown as string;
    return ability.can('view', instance);
  }

  private assertCanManageAlertOfType(
    ability: AppAbility,
    adminOnly: boolean,
  ): void {
    const instance = subject('Alert', {
      alertTypeAdminOnly: adminOnly,
    }) as unknown as string;
    if (!ability.can('manage', instance)) {
      throw new ForbiddenException(
        'Your role is not permitted to manage this type of alert',
      );
    }
  }

  private async getOwnedForManage(
    schoolId: string,
    id: string,
    ability: AppAbility,
  ): Promise<Alert> {
    const alert = await this.alerts.findByIdAndSchool(id, schoolId);
    if (!alert) {
      throw new NotFoundException('Alert not found');
    }
    this.assertCanManageAlertOfType(ability, alert.alertType.adminOnly);
    return alert;
  }

  private async assertPersonBelongsToSchool(
    schoolId: string,
    personId: string,
  ): Promise<void> {
    const person = await this.people.findOne({
      where: { id: personId, schoolId },
    });
    if (!person) {
      throw new BadRequestException('personId does not belong to this school');
    }
  }
}
