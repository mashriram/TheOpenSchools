import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, In } from 'typeorm';
import { isDuplicateEntryError } from '../../common/duplicate-entry-error';
import { CoursesRepository } from './repositories/courses.repository';
import { SchoolYearsRepository } from '../school/repositories/school-years.repository';
import { DepartmentsRepository } from '../school/repositories/departments.repository';
import { YearGroupsRepository } from '../school/repositories/year-groups.repository';
import { Course } from './entities/course.entity';
import { CourseYearGroup } from './entities/course-year-group.entity';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

@Injectable()
export class CoursesService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly courses: CoursesRepository,
    private readonly schoolYears: SchoolYearsRepository,
    private readonly departments: DepartmentsRepository,
    private readonly yearGroups: YearGroupsRepository,
  ) {}

  list(schoolId: string, schoolYearId?: string): Promise<Course[]> {
    return this.courses.findBySchool(schoolId, schoolYearId);
  }

  async create(schoolId: string, dto: CreateCourseDto): Promise<Course> {
    await this.assertSchoolYearBelongsToSchool(schoolId, dto.schoolYearId);
    await this.assertDepartmentBelongsToSchool(schoolId, dto.departmentId);
    await this.assertYearGroupsBelongToSchool(schoolId, dto.yearGroupIds);

    try {
      // Course + its CourseYearGroup join rows are created in one
      // transaction, matching SignupService's precedent for a multi-entity
      // write that must not leave a partial Course behind on failure.
      return await this.dataSource.transaction(async (manager) => {
        const coursesRepo = manager.getRepository(Course);
        const courseYearGroupsRepo = manager.getRepository(CourseYearGroup);

        const course = await coursesRepo.save(
          coursesRepo.create({
            schoolId,
            schoolYearId: dto.schoolYearId,
            departmentId: dto.departmentId ?? null,
            name: dto.name,
            shortName: dto.shortName,
            description: dto.description ?? null,
            includeInCurriculumMaps: dto.includeInCurriculumMaps ?? true,
            sequenceNumber: dto.sequenceNumber ?? 0,
          }),
        );

        if (dto.yearGroupIds && dto.yearGroupIds.length > 0) {
          await courseYearGroupsRepo.save(
            dto.yearGroupIds.map((yearGroupId) =>
              courseYearGroupsRepo.create({
                courseId: course.id,
                yearGroupId,
              }),
            ),
          );
        }

        return course;
      });
    } catch (error) {
      if (isDuplicateEntryError(error)) {
        throw new ConflictException(
          `A course with short name "${dto.shortName}" already exists in this school year`,
        );
      }
      throw error;
    }
  }

  async update(
    schoolId: string,
    id: string,
    dto: UpdateCourseDto,
  ): Promise<Course> {
    const course = await this.getOwned(schoolId, id);
    await this.assertDepartmentBelongsToSchool(schoolId, dto.departmentId);
    await this.assertYearGroupsBelongToSchool(schoolId, dto.yearGroupIds);

    const { yearGroupIds, ...fields } = dto;
    Object.assign(course, fields);

    try {
      return await this.dataSource.transaction(async (manager) => {
        const coursesRepo = manager.getRepository(Course);
        const courseYearGroupsRepo = manager.getRepository(CourseYearGroup);

        const saved = await coursesRepo.save(course);

        // A provided yearGroupIds replaces the full set: delete then
        // re-insert, rather than diffing - simpler, and this list is small.
        if (yearGroupIds !== undefined) {
          await courseYearGroupsRepo.delete({ courseId: id });
          if (yearGroupIds.length > 0) {
            await courseYearGroupsRepo.save(
              yearGroupIds.map((yearGroupId) =>
                courseYearGroupsRepo.create({ courseId: id, yearGroupId }),
              ),
            );
          }
        }

        return saved;
      });
    } catch (error) {
      if (isDuplicateEntryError(error)) {
        throw new ConflictException(
          `A course with short name "${course.shortName}" already exists in this school year`,
        );
      }
      throw error;
    }
  }

  async remove(schoolId: string, id: string): Promise<void> {
    const course = await this.getOwned(schoolId, id);
    await this.courses.softRemove(course);
  }

  /** Also used by CourseClassesService/UnitsService to authorize a Course id. */
  async getOwned(schoolId: string, id: string): Promise<Course> {
    const course = await this.courses.findByIdAndSchool(id, schoolId);
    if (!course) {
      throw new NotFoundException('Course not found');
    }
    return course;
  }

  private async assertSchoolYearBelongsToSchool(
    schoolId: string,
    schoolYearId: string,
  ): Promise<void> {
    const schoolYear = await this.schoolYears.findOne({
      where: { id: schoolYearId, schoolId },
    });
    if (!schoolYear) {
      throw new BadRequestException(
        'schoolYearId does not belong to this school',
      );
    }
  }

  private async assertDepartmentBelongsToSchool(
    schoolId: string,
    departmentId: string | undefined,
  ): Promise<void> {
    if (!departmentId) {
      return;
    }
    const department = await this.departments.findOne({
      where: { id: departmentId, schoolId },
    });
    if (!department) {
      throw new BadRequestException(
        'departmentId does not belong to this school',
      );
    }
  }

  private async assertYearGroupsBelongToSchool(
    schoolId: string,
    yearGroupIds: string[] | undefined,
  ): Promise<void> {
    if (!yearGroupIds || yearGroupIds.length === 0) {
      return;
    }
    const found = await this.yearGroups.find({
      where: { schoolId, id: In(yearGroupIds) },
    });
    if (found.length !== new Set(yearGroupIds).size) {
      throw new BadRequestException(
        'yearGroupIds must all belong to this school',
      );
    }
  }
}
