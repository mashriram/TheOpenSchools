import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { In } from 'typeorm';
import { BehavioursRepository } from './repositories/behaviours.repository';
import { SchoolYearsRepository } from '../school/repositories/school-years.repository';
import { PeopleRepository } from '../people/repositories/people.repository';
import { RolesRepository } from '../rbac/repositories/roles.repository';
import { FamilyAdultsRepository } from '../people/repositories/family-adults.repository';
import { FamilyChildrenRepository } from '../people/repositories/family-children.repository';
import { Behaviour } from './entities/behaviour.entity';
import { CreateBehaviourDto } from './dto/create-behaviour.dto';
import { UpdateBehaviourDto } from './dto/update-behaviour.dto';
import type {
  BehaviourDetailView,
  BehaviourSummaryView,
} from './behaviour-view.dto';

export type BehaviourViewerClass = 'self' | 'child' | 'staff';

@Injectable()
export class BehaviourService {
  constructor(
    private readonly behaviours: BehavioursRepository,
    private readonly schoolYears: SchoolYearsRepository,
    private readonly people: PeopleRepository,
    private readonly roles: RolesRepository,
    private readonly familyAdults: FamilyAdultsRepository,
    private readonly familyChildren: FamilyChildrenRepository,
  ) {}

  async create(
    schoolId: string,
    creatorPersonId: string,
    dto: CreateBehaviourDto,
  ): Promise<Behaviour> {
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

    return this.behaviours.save(
      this.behaviours.create({
        schoolYearId: dto.schoolYearId,
        date: dto.date,
        personId: dto.personId,
        type: dto.type,
        descriptor: dto.descriptor ?? null,
        level: dto.level ?? null,
        comment: dto.comment ?? null,
        followup: dto.followup ?? null,
        multiIncidentId: dto.multiIncidentId ?? null,
        creatorPersonId,
      }),
    );
  }

  async update(
    schoolId: string,
    id: string,
    dto: UpdateBehaviourDto,
  ): Promise<Behaviour> {
    const behaviour = await this.getOwned(schoolId, id);
    Object.assign(behaviour, dto);
    return this.behaviours.save(behaviour);
  }

  async remove(schoolId: string, id: string): Promise<void> {
    const behaviour = await this.getOwned(schoolId, id);
    await this.behaviours.remove(behaviour);
  }

  async getOwned(schoolId: string, id: string): Promise<Behaviour> {
    const behaviour = await this.behaviours.findByIdAndSchool(id, schoolId);
    if (!behaviour) {
      throw new NotFoundException('Behaviour record not found');
    }
    return behaviour;
  }

  async getVisibleBehaviour(
    schoolId: string,
    id: string,
    callerPersonId: string,
    activeRoleId: string,
  ): Promise<BehaviourSummaryView | BehaviourDetailView> {
    const behaviour = await this.getOwned(schoolId, id);
    const viewerClass = await this.classifyViewer(
      callerPersonId,
      activeRoleId,
      behaviour.personId,
    );
    return this.toView(behaviour, viewerClass);
  }

  async listForPerson(
    schoolId: string,
    personId: string,
    callerPersonId: string,
    activeRoleId: string,
  ): Promise<(BehaviourSummaryView | BehaviourDetailView)[]> {
    const person = await this.people.findOne({
      where: { id: personId, schoolId },
    });
    if (!person) {
      throw new BadRequestException('personId does not belong to this school');
    }
    const viewerClass = await this.classifyViewer(
      callerPersonId,
      activeRoleId,
      personId,
    );
    const rows = await this.behaviours.findByPerson(personId);
    return rows.map((row) => this.toView(row, viewerClass));
  }

  /**
   * Reproduces Gibbon's real `_myself`/`_myChildren`/`_all` viewer
   * classification. Unlike Timetable/Markbook/Attendance's equivalent
   * (which allow Staff/Other to view *any* person unconditionally), a
   * Student/Parent with no relationship to the target is denied outright
   * here, not just field-restricted - a Student has no legitimate reason
   * to view another (unrelated) student's behaviour record at all.
   */
  private async classifyViewer(
    callerPersonId: string,
    activeRoleId: string,
    targetPersonId: string,
  ): Promise<BehaviourViewerClass> {
    if (callerPersonId === targetPersonId) {
      return 'self';
    }
    const role = await this.roles.findOne({ where: { id: activeRoleId } });
    if (role?.category === 'Staff' || role?.category === 'Other') {
      return 'staff';
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
          return 'child';
        }
      }
    }
    throw new ForbiddenException(
      'You do not have access to this behaviour record',
    );
  }

  private toView(
    behaviour: Behaviour,
    viewerClass: BehaviourViewerClass,
  ): BehaviourSummaryView | BehaviourDetailView {
    const summary: BehaviourSummaryView = {
      id: behaviour.id,
      date: behaviour.date,
      personId: behaviour.personId,
      type: behaviour.type,
      descriptor: behaviour.descriptor,
    };
    if (viewerClass !== 'staff') {
      return summary;
    }
    return {
      ...summary,
      level: behaviour.level,
      comment: behaviour.comment,
      followup: behaviour.followup,
    };
  }
}
