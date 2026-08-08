import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { In } from 'typeorm';
import { MarkbookEntriesRepository } from './repositories/markbook-entries.repository';
import { MarkbookTargetsRepository } from './repositories/markbook-targets.repository';
import { ScaleGradesRepository } from './repositories/scale-grades.repository';
import { MarkbookColumnsService } from './markbook-columns.service';
import { PeopleRepository } from '../people/repositories/people.repository';
import { RolesRepository } from '../rbac/repositories/roles.repository';
import { FamilyAdultsRepository } from '../people/repositories/family-adults.repository';
import { FamilyChildrenRepository } from '../people/repositories/family-children.repository';
import { computeConcern } from './markbook-concern';
import { MarkbookEntry } from './entities/markbook-entry.entity';
import { MarkbookColumn } from './entities/markbook-column.entity';
import { ScaleGrade } from './entities/scale-grade.entity';
import { UpsertMarkbookEntryDto } from './dto/upsert-markbook-entry.dto';

export interface MarkbookCaller {
  personId: string;
  activeRoleId: string;
}

/**
 * Reproduces Gibbon's real markbook visibility gate: an entry is visible to
 * a Student only if the column's `viewableStudents` flag is set, the column
 * is marked `complete`, and `completeDate` (if set) is not in the future;
 * to a Parent, the same gate keyed on `viewableParents` plus the same
 * `childDataAccess` check Timetable's schedule-view gate uses. Teachers and
 * Admins always see the full entry regardless of the column's flags - see
 * plan §Timetable Admin/Timetable/Markbook cluster.
 *
 * A denial returns 404, not 403 (consistent with this codebase's
 * ambiguity-preserving convention for row-level authorization): an
 * unauthorized viewer cannot distinguish "no entry exists yet" from "an
 * entry exists but isn't published to you".
 */
@Injectable()
export class MarkbookEntriesService {
  constructor(
    private readonly entries: MarkbookEntriesRepository,
    private readonly targets: MarkbookTargetsRepository,
    private readonly scaleGrades: ScaleGradesRepository,
    private readonly columns: MarkbookColumnsService,
    private readonly people: PeopleRepository,
    private readonly roles: RolesRepository,
    private readonly familyAdults: FamilyAdultsRepository,
    private readonly familyChildren: FamilyChildrenRepository,
  ) {}

  async listForColumn(
    schoolId: string,
    columnId: string,
  ): Promise<MarkbookEntry[]> {
    await this.columns.getOwned(schoolId, columnId);
    return this.entries.findByColumn(columnId);
  }

  async upsertEntry(
    schoolId: string,
    columnId: string,
    dto: UpsertMarkbookEntryDto,
  ): Promise<MarkbookEntry> {
    const column = await this.columns.getOwned(schoolId, columnId);

    const person = await this.people.findOne({
      where: { id: dto.personId, schoolId },
    });
    if (!person) {
      throw new BadRequestException('personId does not belong to this school');
    }

    let attainmentScaleGradeId: string | null = null;
    let attainmentConcern: MarkbookEntry['attainmentConcern'] = 'N';
    if (dto.attainmentScaleGradeId) {
      const grade = await this.resolveGrade(
        schoolId,
        dto.attainmentScaleGradeId,
        column.scaleIdAttainment,
        'attainment',
      );
      attainmentScaleGradeId = grade.id;
      attainmentConcern = await this.computeAttainmentConcern(
        column,
        dto.personId,
        grade,
      );
    }

    let effortScaleGradeId: string | null = null;
    let effortConcern: MarkbookEntry['effortConcern'] = 'N';
    if (dto.effortScaleGradeId) {
      const grade = await this.resolveGrade(
        schoolId,
        dto.effortScaleGradeId,
        column.scaleIdEffort,
        'effort',
      );
      effortScaleGradeId = grade.id;
      const lowestAcceptable = await this.scaleGrades.findLowestAcceptable(
        column.scaleIdEffort!,
      );
      effortConcern = computeConcern(grade, null, lowestAcceptable);
    }

    const existing = await this.entries.findByColumnAndPerson(
      columnId,
      dto.personId,
    );
    if (existing) {
      existing.attainmentScaleGradeId = attainmentScaleGradeId;
      existing.attainmentConcern = attainmentConcern;
      existing.effortScaleGradeId = effortScaleGradeId;
      existing.effortConcern = effortConcern;
      existing.comment = dto.comment ?? null;
      return this.entries.save(existing);
    }

    return this.entries.save(
      this.entries.create({
        markbookColumnId: columnId,
        personId: dto.personId,
        attainmentScaleGradeId,
        attainmentConcern,
        effortScaleGradeId,
        effortConcern,
        comment: dto.comment ?? null,
      }),
    );
  }

  async getVisibleEntryForCaller(
    schoolId: string,
    columnId: string,
    targetPersonId: string,
    caller: MarkbookCaller,
  ): Promise<MarkbookEntry> {
    const column = await this.columns.getOwned(schoolId, columnId);
    const entry = await this.entries.findByColumnAndPerson(
      columnId,
      targetPersonId,
    );
    if (!entry) {
      throw new NotFoundException('Markbook entry not found');
    }

    const role = await this.roles.findOne({
      where: { id: caller.activeRoleId },
    });

    if (role?.category === 'Staff' || role?.category === 'Other') {
      return entry;
    }

    if (
      role?.category === 'Student' &&
      caller.personId === targetPersonId &&
      this.isColumnPublished(column, column.viewableStudents)
    ) {
      return entry;
    }

    if (
      role?.category === 'Parent' &&
      this.isColumnPublished(column, column.viewableParents)
    ) {
      const hasAccess = await this.hasChildDataAccess(
        caller.personId,
        targetPersonId,
      );
      if (hasAccess) {
        return entry;
      }
    }

    throw new NotFoundException('Markbook entry not found');
  }

  private async resolveGrade(
    schoolId: string,
    scaleGradeId: string,
    columnScaleId: string | null,
    label: 'attainment' | 'effort',
  ): Promise<ScaleGrade> {
    if (!columnScaleId) {
      throw new BadRequestException(
        `This column has no ${label} scale configured`,
      );
    }
    const grade = await this.scaleGrades.findByIdAndSchool(
      scaleGradeId,
      schoolId,
    );
    if (!grade || grade.scaleId !== columnScaleId) {
      throw new BadRequestException(
        `${label}ScaleGradeId does not belong to this column's ${label} scale`,
      );
    }
    return grade;
  }

  private async computeAttainmentConcern(
    column: MarkbookColumn,
    personId: string,
    grade: ScaleGrade,
  ): Promise<MarkbookEntry['attainmentConcern']> {
    const target = await this.targets.findByCourseClassAndPerson(
      column.courseClassId,
      personId,
    );
    const lowestAcceptable = await this.scaleGrades.findLowestAcceptable(
      column.scaleIdAttainment!,
    );
    return computeConcern(
      grade,
      target?.targetScaleGrade ?? null,
      lowestAcceptable,
    );
  }

  private isColumnPublished(
    column: MarkbookColumn,
    viewableFlag: boolean,
  ): boolean {
    if (!viewableFlag || !column.complete) {
      return false;
    }
    if (column.completeDate && column.completeDate > this.today()) {
      return false;
    }
    return true;
  }

  private async hasChildDataAccess(
    parentPersonId: string,
    targetPersonId: string,
  ): Promise<boolean> {
    const accessibleFamilyIds = (
      await this.familyAdults.find({
        where: { personId: parentPersonId, childDataAccess: true },
      })
    ).map((adult) => adult.familyId);
    if (accessibleFamilyIds.length === 0) {
      return false;
    }
    const child = await this.familyChildren.findOne({
      where: { personId: targetPersonId, familyId: In(accessibleFamilyIds) },
    });
    return !!child;
  }

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
